#!/usr/bin/env python
from os import environ as env
from flask import Flask, jsonify, request
import requests
import pandas as pd
import json
from dotenv import load_dotenv
app = Flask(__name__)


def parseLinkHeader(headers):
    links = {}
    if "link" in headers:
        linkHeaders = headers["link"].split(", ")
        for linkHeader in linkHeaders:
            (url, rel) = linkHeader.split("; ")
            url = url[1:-1]
            rel = rel[5:-1]
            links[rel] = url
    return links


def collect_things(endpoint):
    parameters = {"per_page": 100}
    response = requests.get(endpoint, parameters)
    link_headers = parseLinkHeader(response.headers)
    things = response.json()
    while 'next' in link_headers:
        response = requests.get(link_headers['next'], params=parameters)
        link_headers = parseLinkHeader(response.headers)
        things = things + response.json()
    return things


@app.route('/langs')
def langs():
    client_id = env['CLIENT_ID']
    client_secret = env['CLIENT_SECRET']
    username = request.args.get('username')
    base_url = f'https://api.github.com/users/{username}/repos'
    end_url = f'?client_id={client_id}&client_secret={client_secret}'
    user_repos = requests.get(base_url + end_url)
    repos = user_repos.json()
    while 'next' in user_repos.links.keys():
        user_repos = requests.get(user_repos.links['next']['url'])
        repos.extend(user_repos.json())
    repo_df = pd.DataFrame(repos)
    langs = repo_df['language'].value_counts()
    lang_json = langs.to_json()
    return app.response_class(
        response=lang_json,
        status=200,
        mimetype='application/json'
    )


@app.route('/commits')
def commits():
    client_id = env['CLIENT_ID']
    client_secret = env['CLIENT_SECRET']
    username = request.args.get('username')
    base_url = f'https://api.github.com/users/{username}/repos'
    end_url = f'?client_id={client_id}&client_secret={client_secret}'
    user_repos = requests.get(base_url + end_url)
    repos = user_repos.json()
    while 'next' in user_repos.links.keys():
        user_repos = requests.get(user_repos.links['next']['url'])
        repos.extend(user_repos.json())
    repo_df = pd.DataFrame(repos)
    repo_names = list(repo_df['name'])
    reps = list(repo_names)
    punch_first = f'https://api.github.com/repos/'
    punch_last = f'{username}/{reps[1]}/stats/punch_card'
    punch_link = punch_first + punch_last + end_url
    punch_card = collect_things(punch_link)
    punch_df = pd.DataFrame(punch_card, dtype='str')
    day = pd.Series(punch_df[0])
    hour = pd.Series(punch_df[1])
    commits = pd.Series(punch_df[2])
    assemble = pd.concat([day, hour, commits], axis=1)
    assemble.columns = ['Day', 'Hour', 'Commits']
    comms = assemble.to_json(orient='index')
    return app.response_class(
        response=comms,
        status=200,
        mimetype='application/json'
    )


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
