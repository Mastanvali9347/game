import random
from typing import List, Optional


def generate_tambola_ticket() -> List[List[Optional[int]]]:
    ticket = [[None for _ in range(9)] for _ in range(3)]

    # column ranges
    col_ranges = [
        (1, 9), (10, 19), (20, 29), (30, 39),
        (40, 49), (50, 59), (60, 69),
        (70, 79), (80, 90)
    ]

    # decide how many numbers per column (total 15)
    cols_count = [1] * 9
    remaining = 6
    while remaining > 0:
        i = random.randint(0, 8)
        if cols_count[i] < 3:
            cols_count[i] += 1
            remaining -= 1

    # generate column numbers
    columns_data = []
    for i in range(9):
        start, end = col_ranges[i]
        nums = sorted(random.sample(range(start, end + 1), cols_count[i]))
        columns_data.append(nums)

    row_counts = [0, 0, 0]

    # place numbers into grid
    for col_idx, nums in enumerate(columns_data):
        rows = [0, 1, 2]
        random.shuffle(rows)

        for num in nums:
            for r in rows:
                if ticket[r][col_idx] is None and row_counts[r] < 5:
                    ticket[r][col_idx] = num
                    row_counts[r] += 1
                    break

    return ticket


def validate_claim(
    claim_type: str,
    ticket: List[List[Optional[int]]],
    called_numbers: List[int],
    marked_numbers: List[int]
) -> bool:

    # only valid called numbers
    if not set(marked_numbers).issubset(set(called_numbers)):
        return False

    ticket_numbers = [n for row in ticket for n in row if n is not None]
    marked_set = set(marked_numbers)

    if claim_type == "early5":
        return len(marked_set.intersection(ticket_numbers)) >= 5

    if claim_type == "line1":
        row = [n for n in ticket[0] if n is not None]
        return set(row).issubset(marked_set)

    if claim_type == "line2":
        row = [n for n in ticket[1] if n is not None]
        return set(row).issubset(marked_set)

    if claim_type == "line3":
        row = [n for n in ticket[2] if n is not None]
        return set(row).issubset(marked_set)

    if claim_type == "fullhouse":
        return set(ticket_numbers).issubset(marked_set)

    return False