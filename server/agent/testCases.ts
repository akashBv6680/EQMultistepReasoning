import { TestCase } from "./types.js";

export const EVALUATION_TEST_CASES: TestCase[] = [
  // 10 Easy Questions (Basic arithmetic, direct time differences, straightforward counting)
  {
    id: "easy-01",
    category: "easy",
    title: "Train Journey Time",
    question: "If a train leaves at 14:30 and arrives at 18:05, how long is the journey?",
    expected_answer_hint: "3 hours 35 minutes",
    focus_area: "Direct time duration within the same afternoon"
  },
  {
    id: "easy-02",
    category: "easy",
    title: "Alice's Apples",
    question: "Alice has 3 red apples and twice as many green apples as red. How many apples does she have in total?",
    expected_answer_hint: "9 apples",
    focus_area: "Multiplicative ratio and summation"
  },
  {
    id: "easy-03",
    category: "easy",
    title: "Meeting Slot Fit",
    question: "A meeting needs 60 minutes. There are free slots: 09:00–09:30, 09:45–10:30, 11:00–12:00. Which slots can fit the meeting?",
    expected_answer_hint: "11:00–12:00",
    focus_area: "Time slot duration filtering"
  },
  {
    id: "easy-04",
    category: "easy",
    title: "Cookie Box Packaging",
    question: "A baker has 48 cookies. He packs them into boxes of 6 cookies each. How many full boxes can he make?",
    expected_answer_hint: "8 boxes",
    focus_area: "Exact integer division"
  },
  {
    id: "easy-05",
    category: "easy",
    title: "Morning Flight Duration",
    question: "A flight departs at 07:45 AM and arrives at 11:15 AM on the same morning. What is the duration of the flight?",
    expected_answer_hint: "3 hours 30 minutes",
    focus_area: "AM time difference calculation"
  },
  {
    id: "easy-06",
    category: "easy",
    title: "Jacket Discount Calculation",
    question: "A store offers a 20% discount on an $80 jacket. What is the final sale price before tax?",
    expected_answer_hint: "$64",
    focus_area: "Percentage discount deduction"
  },
  {
    id: "easy-07",
    category: "easy",
    title: "Age Relationship",
    question: "Bob is 12 years old. His father is three times his age plus 4 years. How old is Bob's father?",
    expected_answer_hint: "40 years old",
    focus_area: "Linear arithmetic formulation"
  },
  {
    id: "easy-08",
    category: "easy",
    title: "Water Tank Fill Rate",
    question: "A water tank holds 500 liters. A pump fills it at a constant rate of 25 liters per minute. How many minutes will it take to fill the tank from empty?",
    expected_answer_hint: "20 minutes",
    focus_area: "Rate and volume division"
  },
  {
    id: "easy-09",
    category: "easy",
    title: "Highway Distance",
    question: "A car travels at a steady speed of 60 miles per hour for 2 hours and 30 minutes. What total distance does it cover?",
    expected_answer_hint: "150 miles",
    focus_area: "Speed x fractional time"
  },
  {
    id: "easy-10",
    category: "easy",
    title: "Stationery Purchase Total",
    question: "Liam bought 4 notebooks for $3.50 each and 2 pens for $1.75 each. How much money did he spend in total?",
    expected_answer_hint: "$17.50",
    focus_area: "Multi-item price calculation"
  },

  // 5 Tricky Questions (Boundary edge cases, midnight wrap-around, naive traps, integer constraints)
  {
    id: "tricky-01",
    category: "tricky",
    title: "Overnight Train (Midnight Wrap)",
    question: "A train leaves at 22:45 on Monday night and arrives at 02:15 on Tuesday morning. How long is the journey in hours and minutes?",
    expected_answer_hint: "3 hours 30 minutes",
    focus_area: "Midnight 24-hour boundary crossing (naive subtraction 2:15 - 22:45 yields negative without day wrap)"
  },
  {
    id: "tricky-02",
    category: "tricky",
    title: "Snail in the Well (Boundary Trap)",
    question: "A snail is at the bottom of a 10-meter well. Each day it climbs up 3 meters, but each night it slips back 2 meters. On which day does the snail first reach the top of the well?",
    expected_answer_hint: "Day 8",
    focus_area: "Boundary arrival before nightly slip (naive daily net rate 1m/day would incorrectly predict day 10)"
  },
  {
    id: "tricky-03",
    category: "tricky",
    title: "Workshop Scheduling with Busy Blocks",
    question: "Can a team schedule a 90-minute workshop between 13:00 and 17:00 if unavailable blocks are 13:30–14:30 and 15:00–16:00? Which time window, if any, can accommodate the full workshop?",
    expected_answer_hint: "No time window can accommodate the 90-minute workshop",
    focus_area: "Multi-constraint interval packing (available gaps are only 30m, 30m, and 60m; none is >= 90m)"
  },
  {
    id: "tricky-04",
    category: "tricky",
    title: "Ducks and Cows (System of Equations)",
    question: "A farmer has 10 animals consisting only of ducks and cows. Together they have 28 legs. How many ducks and how many cows does the farmer have?",
    expected_answer_hint: "6 ducks and 4 cows",
    focus_area: "Multi-variable integer constraint (ducks have 2 legs, cows have 4 legs; 2d + 4c = 28 and d + c = 10)"
  },
  {
    id: "tricky-05",
    category: "tricky",
    title: "Room Capacity & Joint Membership",
    question: "A conference room has a strict maximum capacity of 25 people. Group A has 14 members, Group B has 12 members, and exactly 4 people belong to both groups. Can both groups attend a joint meeting together without exceeding the room capacity?",
    expected_answer_hint: "Yes, exactly 22 people will attend, which is under the 25-person capacity",
    focus_area: "Inclusion-exclusion principle (naive addition 14 + 12 = 26 would incorrectly reject, but 14 + 12 - 4 = 22 fits)"
  },
  {
    id: "tricky-06",
    category: "tricky",
    title: "Battery Charge & Drain (100% Physical Cap)",
    question: "A phone battery starts at 20%. It drains at 1% per minute for 10 minutes, and then charges at 2% per minute for 60 minutes. What is the final battery percentage?",
    expected_answer_hint: "100%",
    focus_area: "Unit rates multiplied by elapsed time, with physical boundary capacity cap at 100% (preventing naive addition)"
  }
];
