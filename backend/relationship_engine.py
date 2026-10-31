import re
import uuid
from functools import lru_cache


@lru_cache(maxsize=1)
def get_nlp():
    import spacy
    from spacy.lang.en import English

    nlp = spacy.load("en_core_web_sm", exclude=["tokenizer"])
    nlp.tokenizer = English(vocab=nlp.vocab).tokenizer

    return nlp


def determine_assessment(sentence):
    preliminary_patterns = [
        r"\bsuggest(?:s|ed)?\b",
        r"\bmay\b",
        r"\bmight\b",
        r"\bcould\b",
        r"\bpossibly\b",
        r"\bpotential(?:ly)?\b",
        r"\bsuspect(?:ed|s)?\b",
        r"\balleged\b",
        r"\bappears?\b",
        r"\bunconfirmed\b",
        r"\bnot confirmed\b",
        r"\bunder investigation\b",
        r"\binitial findings\b",
        r"\bpreliminary\b"
    ]

    for pattern in preliminary_patterns:
        if re.search(pattern, sentence, re.IGNORECASE):
            return "PRELIMINARY"

    return "DOCUMENTED"


def clean_entity(value):
    value = re.sub(r"\s+", " ", value).strip()

    value = re.sub(
        r"^(?:at|on|during|following|after|before)\s+"
        r"(?:\d{1,2}:\d{2}\s*(?:AM|PM)?|"
        r"[A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\s*,?\s*",
        "",
        value,
        flags=re.IGNORECASE
    )

    return value.strip(" ,.;:")


def normalize_relation(relation):
    aliases = {
        "DETECT": "DETECTED",
        "DETECTED": "DETECTED",
        "IDENTIFY": "IDENTIFIED",
        "IDENTIFIED": "IDENTIFIED",
        "DISCOVER": "DISCOVERED",
        "DISCOVERED": "DISCOVERED",
        "ACCESS": "ACCESSED",
        "ACCESSED": "ACCESSED",
        "OPEN": "ACCESSED",
        "OPENED": "ACCESSED",
        "DOWNLOAD": "DOWNLOADED",
        "DOWNLOADED": "DOWNLOADED",
        "RETRIEVE": "RETRIEVED",
        "RETRIEVED": "RETRIEVED",
        "CONNECT": "CONNECTED_TO",
        "CONNECTED": "CONNECTED_TO",
        "COMMUNICATE": "COMMUNICATED_WITH",
        "COMMUNICATED": "COMMUNICATED_WITH",
        "REPORT": "REPORTED",
        "REPORTED": "REPORTED",
        "FLAG": "FLAGGED",
        "FLAGGED": "FLAGGED",
        "INVESTIGATE": "INVESTIGATED",
        "INVESTIGATED": "INVESTIGATED",
        "EXAMINE": "EXAMINED",
        "EXAMINED": "EXAMINED",
        "REVIEW": "REVIEWED",
        "REVIEWED": "REVIEWED",
        "EXPERIENCE": "EXPERIENCED",
        "EXPERIENCED": "EXPERIENCED",
        "TRANSFER": "TRANSFERRED",
        "TRANSFERRED": "TRANSFERRED",
        "UPLOAD": "UPLOADED",
        "UPLOADED": "UPLOADED",
        "SEND": "SENT",
        "SENT": "SENT"
    }

    normalized = re.sub(
        r"[^A-Za-z0-9]+",
        "_",
        relation.upper()
    ).strip("_")

    return aliases.get(normalized, normalized)


def create_relationship(
    source,
    relation,
    target,
    evidence,
    page_number,
    assessment="DOCUMENTED",
    extraction_method="RULE_BASED"
):
    return {
        "id": str(uuid.uuid4()),
        "source": source,
        "relation": relation,
        "target": target,
        "evidence": evidence,
        "page_number": page_number,
        "assessment": assessment,
        "extraction_method": extraction_method
    }


def extract_relationships(text, page_number=1):
    relationships = []
    seen = {}

    def add_relationship(
        source,
        relation,
        target,
        evidence,
        method="RULE_BASED"
    ):
        source = clean_entity(source)
        target = clean_entity(target)
        relation = normalize_relation(relation)

        if not source or not target or not relation:
            return

        if source.lower() == target.lower():
            return

        if len(source) > 150 or len(target) > 150:
            return

        key = (
            source.casefold(),
            relation,
            target.casefold()
        )

        assessment = determine_assessment(evidence)

        if key in seen:
            existing = relationships[seen[key]]

            if (
                existing["extraction_method"] == "RULE_BASED"
                and method == "LINGUISTIC"
            ):
                existing["extraction_method"] = "LINGUISTIC"

            if assessment == "PRELIMINARY":
                existing["assessment"] = "PRELIMINARY"

            return

        seen[key] = len(relationships)

        relationships.append(
            create_relationship(
                source,
                relation,
                target,
                evidence,
                page_number,
                assessment,
                method
            )
        )

    sentences = re.split(r"(?<=[.!?])\s+", text)

    for sentence in sentences:
        sentence = sentence.strip()

        if not sentence:
            continue

        scheduled = re.search(
            r"(Shipment\s+\d+)\s+was\s+scheduled\s+to\s+leave\s+"
            r"(.+?)\s+at\s+(\d{1,2}:\d{2}\s*(?:AM|PM))",
            sentence,
            re.IGNORECASE
        )

        if scheduled:
            add_relationship(
                scheduled.group(1),
                "SCHEDULED_DEPARTURE_FROM",
                scheduled.group(2),
                sentence
            )

            add_relationship(
                scheduled.group(1),
                "SCHEDULED_DEPARTURE_TIME",
                scheduled.group(3),
                sentence
            )

        shipment_delay = re.search(
            r"(Shipment\s+\d+)\s+was\s+delayed\s+by\s+"
            r"(.+?)(?:\.|$)",
            sentence,
            re.IGNORECASE
        )

        if shipment_delay:
            add_relationship(
                shipment_delay.group(1),
                "EXPERIENCED_DELAY",
                shipment_delay.group(2),
                sentence
            )

        server_failure = re.search(
            r"((?:the\s+)?[\w\s-]*server)\s+experienced\s+a\s+failure",
            sentence,
            re.IGNORECASE
        )

        if server_failure:
            source = server_failure.group(1)

            if "," in source:
                source = source.split(",")[-1]

            add_relationship(
                source,
                "EXPERIENCED",
                "Server Failure",
                sentence
            )

        contributed = re.search(
            r"server failure\s+contributed\s+to\s+the\s+delay",
            sentence,
            re.IGNORECASE
        )

        if contributed:
            add_relationship(
                "Server Failure",
                "CONTRIBUTED_TO",
                "Shipment Delay",
                sentence
            )

        reported = re.search(
            r"([A-Z][A-Za-z\s]+Corporation)\s+reported\s+that\s+"
            r"(.+?)(?:\.|$)",
            sentence
        )

        if reported:
            add_relationship(
                reported.group(1),
                "REPORTED",
                reported.group(2),
                sentence
            )

    try:
        nlp = get_nlp()

        for line in text.splitlines():
            line = line.strip()

            if not line or len(line) > 1000:
                continue

            doc = nlp(line)

            for sentence in doc.sents:
                evidence = sentence.text.strip()

                for token in sentence:
                    if token.pos_ != "VERB":
                        continue

                    if token.lemma_.lower() in {
                        "be",
                        "have",
                        "do",
                        "suggest",
                        "indicate",
                        "appear",
                        "seem"
                    }:
                        continue

                    subjects = [
                        child
                        for child in token.children
                        if child.dep_ in {
                            "nsubj",
                            "nsubjpass",
                            "csubj"
                        }
                    ]

                    objects = [
                        child
                        for child in token.children
                        if child.dep_ in {
                            "dobj",
                            "obj",
                            "attr",
                            "oprd",
                            "dative"
                        }
                    ]

                    if not objects:
                        for child in token.children:
                            if child.dep_ == "prep":
                                objects.extend(
                                    grandchild
                                    for grandchild in child.children
                                    if grandchild.dep_ == "pobj"
                                )

                    for subject in subjects:
                        subject_text = " ".join(
                            word.text
                            for word in subject.subtree
                        )

                        for obj in objects:
                            object_text = " ".join(
                                word.text
                                for word in obj.subtree
                            )

                            add_relationship(
                                subject_text,
                                token.lemma_,
                                object_text,
                                evidence,
                                "LINGUISTIC"
                            )

    except Exception:
        pass

    cyber_patterns = [
        (
            r"(.+?)\s+(?:detected|identified|discovered)\s+"
            r"(.+?)(?:\.|$)",
            "DETECTED"
        ),
        (
            r"(.+?)\s+(?:accessed|opened)\s+(.+?)(?:\.|$)",
            "ACCESSED"
        ),
        (
            r"(.+?)\s+(?:connected|communicated)\s+"
            r"(?:to|with)\s+(.+?)(?:\.|$)",
            "CONNECTED_TO"
        ),
        (
            r"(.+?)\s+(?:investigated|examined|reviewed)\s+"
            r"(.+?)(?:\.|$)",
            "INVESTIGATED"
        )
    ]

    for sentence in sentences:
        sentence = sentence.strip()

        if not sentence:
            continue

        for pattern, relation in cyber_patterns:
            match = re.search(
                pattern,
                sentence,
                re.IGNORECASE
            )

            if not match:
                continue

            source = clean_entity(match.group(1))
            target = clean_entity(match.group(2))

            if re.search(
                r"\b(?:suggests?|indicates?|may|might|could)\b",
                source,
                re.IGNORECASE
            ):
                continue

            add_relationship(
                source,
                relation,
                target,
                sentence
            )

    return {
        "total_relationships": len(relationships),
        "relationships": relationships
    }