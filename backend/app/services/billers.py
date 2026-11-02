CATEGORIES = [
    {"id": "electricity", "name": "Electricity", "icon": "zap"},
    {"id": "gas", "name": "Gas", "icon": "flame"},
    {"id": "water", "name": "Water", "icon": "droplets"},
    {"id": "internet", "name": "Internet", "icon": "wifi"},
    {"id": "tv", "name": "TV", "icon": "tv"},
    {"id": "insurance", "name": "Insurance", "icon": "shield"},
    {"id": "education", "name": "Education", "icon": "graduation"},
]

BILLERS = [
    # Electricity
    {"id": "desco", "name": "DESCO", "category": "electricity", "field_label": "Customer / meter number"},
    {"id": "dpdc", "name": "DPDC", "category": "electricity", "field_label": "Customer number"},
    # Gas
    {"id": "titas", "name": "Titas Gas", "category": "gas", "field_label": "Customer number"},
    {"id": "jalalabad", "name": "Jalalabad Gas", "category": "gas", "field_label": "Customer number"},
    {"id": "karnaphuli", "name": "Karnaphuli Gas", "category": "gas", "field_label": "Customer number"},
    # Water
    {"id": "dhaka-wasa", "name": "Dhaka WASA", "category": "water", "field_label": "Bill number"},
    {"id": "ctg-wasa", "name": "Chattogram WASA", "category": "water", "field_label": "Bill number"},
    {"id": "sylhet-wasa", "name": "Khulna WASA", "category": "water", "field_label": "Bill number"},
    # Internet
    {"id": "link3", "name": "Link3", "category": "internet", "field_label": "User ID"},
    {"id": "carnival", "name": "Carnival Internet", "category": "internet", "field_label": "User ID"},
    {"id": "onesky", "name": "One Sky", "category": "internet", "field_label": "User ID"},
    {"id": "dotnet", "name": "DOT Net", "category": "internet", "field_label": "User ID"},
    # TV
    {"id": "akash", "name": "Akash DTH", "category": "tv", "field_label": "Subscriber ID"},
    {"id": "cable-tv", "name": "Local Cable TV", "category": "tv", "field_label": "Subscriber ID"},
    # Insurance
    {"id": "delta-life", "name": "Delta Life", "category": "insurance", "field_label": "Policy number"},
    {"id": "metlife", "name": "MetLife", "category": "insurance", "field_label": "Policy number"},
    {"id": "popular-life", "name": "Popular Life", "category": "insurance", "field_label": "Policy number"},
    # Education
    {"id": "school-fee", "name": "School / College Fee", "category": "education", "field_label": "Student ID"},
    {"id": "university-fee", "name": "University Fee", "category": "education", "field_label": "Student ID"},
]


def find_biller(biller_id: str):
    return next((b for b in BILLERS if b["id"] == biller_id), None)


def catalogue():
    return [
        {**c, "billers": [b for b in BILLERS if b["category"] == c["id"]]}
        for c in CATEGORIES
    ]