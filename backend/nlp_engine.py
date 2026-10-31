import spacy
from spacy.lang.en import English

nlp = spacy.load("en_core_web_sm", exclude=["tokenizer"])
nlp.tokenizer = English(vocab=nlp.vocab).tokenizer

def extract_entities(text: str):
    document = nlp(text)

    entities = []

    for entity in document.ents:
        entities.append({
            "text": entity.text,
            "label": entity.label_,
            "start": entity.start_char,
            "end": entity.end_char
        })

    return {
        "total_entities": len(entities),
        "entities": entities
    }