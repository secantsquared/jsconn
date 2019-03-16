#!/usr/bin/env python
from requests import get as GET
import requests
import pandas as pd
import sys
import credentials
import json


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

    response = GET(endpoint, parameters)

    link_headers = parseLinkHeader(response.headers)

    things = response.json()

    while 'next' in link_headers:
        response = GET(link_headers['next'], params=parameters)
        link_headers = parseLinkHeader(response.headers)
        things = things + response.json()

    return things


def app():
    user = sys.argv[1]
    repos_link = "https://api.github.com/users/{}/repos?client_id={}&client_secret={}".format(
        user, credentials.creds['CLIENT_ID'], credentials.creds['CLIENT_SECRET'])
    user_repos = requests.get(repos_link)
    repos = user_repos.json()
    while 'next' in user_repos.links.keys():
        user_repos = requests.get(user_repos.links['next']['url'])
        repos.extend(user_repos.json())
    repo_df = pd.DataFrame(repos)
    langs = repo_df['language'].value_counts()
    langs = langs.to_json()
    print(langs)


app()
