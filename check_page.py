import requests

URL = "https://www.digitalbonus.bayern/antragstellung/"
EXPECTED_TEXT = (
    "Neue Anträge können wieder im Januar 2026 gestellt werden. "
    "Der genaue Termin wird demnächst hier veröffentlicht."
)

response = requests.get(URL, timeout=20)
response.raise_for_status()

page = response.text

if EXPECTED_TEXT in page:
    print("UNCHANGED")
else:
    print("CHANGED")
