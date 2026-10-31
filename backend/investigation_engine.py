
import re

from backend.semantic_engine import semantic_search


UNCERTAINTY_PATTERNS = [
    r"\bsuggests?\b",
    r"\bmay\b",
    r"\bmight\b",
    r"\bpossibly\b",
    r"\bpotentially\b",
    r"\bappears?\b",
    r"\bsuspected\b",
    r"\bpreliminary\b",
    r"\binitial findings\b",
    r"\blikely\b",
    r"\bnot confirmed\b",
    r"\bunconfirmed\b",
    r"\bpossible\b"
]

CAUSAL_PATTERNS = [
    r"\bcaused?\b",
    r"\bcontributed?\b",
    r"\bresulted?\b",
    r"\bdue to\b",
    r"\bbecause\b",
    r"\bled to\b",
    r"\btriggered?\b",
    r"\bresponsible for\b"
]

EVENT_PATTERNS = {
    "login": [
        r"\blogin\b",
        r"\blogged in\b",
        r"\bauthentication\b"
    ],
    "ip": [
        r"\bip address\b",
        r"\bunfamiliar ip\b",
        r"\bunknown ip\b"
    ],
    "file": [
        r"\bfile\b",
        r"\baccessed\b",
        r"\baccess\b",
        r"\brecords\b"
    ],
    "transfer": [
        r"\btransfer\b",
        r"\btransferred\b",
        r"\bdata exfiltration\b",
        r"\bexfiltrated\b",
        r"\boutbound\b"
    ],
    "security": [
        r"\bsuspicious\b",
        r"\bsecurity\b",
        r"\battacker\b",
        r"\bunauthorized\b"
    ]
}

STOPWORDS = {
    "what", "when", "where", "which", "whose",
    "there", "their", "about", "would", "could",
    "should", "were", "have", "from", "that",
    "this", "with", "does", "did", "the",
    "and", "for", "was", "are", "how",
    "why", "who", "is", "a", "an",
    "after", "any", "identify", "distinguish",
    "between", "events", "event", "conclusions",
    "unconfirmed", "happened"
}


def split_evidence(text):
    text = re.sub(r"\s+", " ", text).strip()

    return [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?])\s+", text)
        if sentence.strip()
    ]


def matches_pattern(text, patterns):
    return any(
        re.search(pattern, text, re.IGNORECASE)
        for pattern in patterns
    )


def assess_evidence(sentence):
    if matches_pattern(sentence, UNCERTAINTY_PATTERNS):
        return "PRELIMINARY"

    return "DOCUMENTED"


def is_causal_question(query):
    return bool(
        re.search(
            r"\b(why|cause|caused|reason|responsible|contributed|triggered)\b",
            query,
            re.IGNORECASE
        )
    )


def extract_query_terms(query):
    terms = set(
        re.findall(r"\b[a-zA-Z]{3,}\b", query.lower())
    )

    return terms - STOPWORDS


def detect_requested_events(query):
    requested = set()

    for event, patterns in EVENT_PATTERNS.items():
        if matches_pattern(query, patterns):
            requested.add(event)

    return requested


def score_sentence(sentence, query_terms, requested_events, causal_question):
    sentence_lower = sentence.lower()

    sentence_terms = set(
        re.findall(r"\b[a-zA-Z]{3,}\b", sentence_lower)
    )

    overlap = len(query_terms.intersection(sentence_terms))
    score = overlap * 3

    for event in requested_events:
        if matches_pattern(sentence_lower, EVENT_PATTERNS[event]):
            score += 5

    if causal_question and matches_pattern(sentence, CAUSAL_PATTERNS):
        score += 8

    if causal_question and matches_pattern(sentence, UNCERTAINTY_PATTERNS):
        score += 2

    return score


def chronological_key(item):
    match = re.search(
        r"\b(?:at\s+)?(\d{1,2}):(\d{2})\s*(AM|PM)\b",
        item["text"],
        re.IGNORECASE
    )

    if not match:
        return (
            item["page_number"],
            9999
        )

    hour = int(match.group(1)) % 12
    minute = int(match.group(2))
    period = match.group(3).upper()

    if period == "PM":
        hour += 12

    return (
        item["page_number"],
        hour * 60 + minute
    )


def build_answer(selected, assessment):
    documented = [
        item["text"]
        for item in selected
        if item["assessment"] == "DOCUMENTED"
    ]

    preliminary = [
        item["text"]
        for item in selected
        if item["assessment"] == "PRELIMINARY"
    ]

    parts = []

    if documented:
        parts.append(
            "Documented events: "
            + " ".join(documented)
        )

    if preliminary:
        parts.append(
            "Preliminary findings: "
            + " ".join(preliminary)
        )

    if not parts:
        return "The available evidence is insufficient to establish a conclusion."

    answer = " ".join(parts)

    if assessment == "PRELIMINARY":
        answer += (
            " These events do not independently establish "
            "that customer data was successfully stolen."
        )

    return answer


def investigate(query, document, top_k=8):
    search_results = semantic_search(
        query=query,
        document=document,
        top_k=max(top_k, 8)
    )

    retrieved = search_results["results"]

    if not retrieved:
        return {
            "query": query,
            "status": "INSUFFICIENT_EVIDENCE",
            "answer": "No searchable evidence was found.",
            "assessment": "UNKNOWN",
            "sources": []
        }

    query_terms = extract_query_terms(query)
    requested_events = detect_requested_events(query)
    causal_question = is_causal_question(query)

    candidates = []
    seen = set()

    for result in retrieved:
        sentences = split_evidence(result["text"])

        for sentence in sentences:
            normalized = sentence.lower().strip()

            if normalized in seen:
                continue

            seen.add(normalized)

            score = score_sentence(
                sentence,
                query_terms,
                requested_events,
                causal_question
            )

            if score <= 0:
                continue

            candidates.append({
                "text": sentence,
                "page_number": result["page_number"],
                "similarity_score": result["similarity_score"],
                "relevance_score": score,
                "assessment": assess_evidence(sentence),
                "causal_evidence": matches_pattern(
                    sentence,
                    CAUSAL_PATTERNS
                )
            })

    if not candidates:
        return {
            "query": query,
            "status": "INSUFFICIENT_EVIDENCE",
            "answer": "No sufficiently relevant evidence was identified.",
            "assessment": "UNKNOWN",
            "sources": []
        }

    candidates.sort(
        key=lambda item: (
            item["relevance_score"],
            item["similarity_score"]
        ),
        reverse=True
    )

    if causal_question:
        causal_candidates = [
            item
            for item in candidates
            if item["causal_evidence"]
        ]

        if not causal_candidates:
            return {
                "query": query,
                "status": "INSUFFICIENT_EVIDENCE",
                "answer": "The retrieved evidence does not establish a cause.",
                "assessment": "UNKNOWN",
                "sources": []
            }

        selected = causal_candidates[:1]

        supporting = [
            item
            for item in candidates
            if item not in selected
        ]

        selected.extend(supporting[:5])

    else:
        selected = candidates[:6]

    selected.sort(key=chronological_key)

    assessment = (
        "PRELIMINARY"
        if any(
            item["assessment"] == "PRELIMINARY"
            for item in selected
        )
        else "DOCUMENTED"
    )

    answer = build_answer(selected, assessment)

    return {
        "query": query,
        "status": "EVIDENCE_RETRIEVED",
        "answer": answer,
        "assessment": assessment,
        "sources": [
            {
                "page_number": item["page_number"],
                "evidence": item["text"],
                "similarity_score": item["similarity_score"],
                "relevance_score": item["relevance_score"],
                "assessment": item["assessment"]
            }
            for item in selected
        ]
    }
