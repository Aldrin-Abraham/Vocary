#!/bin/bash
# Force specific dependency versions
pip install --upgrade pip
pip install werkzeug==2.0.3 --no-deps
pip install -r requirements.txt