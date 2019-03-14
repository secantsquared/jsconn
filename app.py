#!/usr/bin/env python
from requests import get as GET
import requests
import pandas as pd
import sys
import os
from env import CLIENT_ID, CLIENT_SECRET
 
# r = GET(f"https://api.github.com/users/{sys.argv[1]}/repos?client_id={os.environ['CLIENT_ID']}&client_secret={os.environ['CLIENT_SECRET']}")

 


print(CLIENT_ID)