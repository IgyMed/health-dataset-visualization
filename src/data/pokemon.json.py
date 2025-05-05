import csv
import pandas as pd
import sys

pokemon = pd.read_csv("src/data/aiv-ss25-pokemon.csv")

# here you can add any preprocessing code

pokemon.drop(
    columns=[
        "name",
        "japanese_name",
    ]
).to_json(sys.stdout, orient="records")
