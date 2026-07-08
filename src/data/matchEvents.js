export const matchEvents = [
  {
    type: "KICKOFF",
    label: "Kickoff 🏁",
    defaultText: "The referee blows the whistle, and the match is officially underway under the bright stadium lights!",
    icon: "🏁",
    severity: "low"
  },
  {
    type: "GOAL",
    label: "Goal ⚽",
    defaultText: "GOAL! A magnificent strike flys past the goalkeeper into the top corner of the net!",
    icon: "⚽",
    severity: "critical"
  },
  {
    type: "MISS",
    label: "Near Miss 🎯",
    defaultText: "Oh! Just wide! The shot beats the keeper but clips the outside of the post and goes out.",
    icon: "🎯",
    severity: "medium"
  },
  {
    type: "FOUL",
    label: "Foul 💥",
    defaultText: "A hard challenge in the midfield. The player is brought down, and the referee awards a free-kick.",
    icon: "💥",
    severity: "low"
  },
  {
    type: "YELLOW_CARD",
    label: "Yellow Card 🟨",
    defaultText: "The referee stops play and pulls out a yellow card for that reckless tactical foul.",
    icon: "🟨",
    severity: "medium"
  },
  {
    type: "RED_CARD",
    label: "Red Card 🟥",
    defaultText: "RED CARD! A straight red for a dangerous tackle! The team is down to 10 men!",
    icon: "🟥",
    severity: "critical"
  },
  {
    type: "SUBSTITUTION",
    label: "Substitution 🔄",
    defaultText: "A tactical change. The manager pulls off a tired midfielder and sends on a fresh attacker.",
    icon: "🔄",
    severity: "low"
  },
  {
    type: "VAR_REVIEW",
    label: "VAR Review 🖥️",
    defaultText: "Play is halted! The referee is checking the monitor for a potential penalty infraction.",
    icon: "🖥️",
    severity: "high"
  },
  {
    type: "CORNER",
    label: "Corner Kick 📐",
    defaultText: "A deflected cross goes behind. The players crowd the box as they prepare for the corner kick.",
    icon: "📐",
    severity: "low"
  },
  {
    type: "FULL_TIME",
    label: "Full Time 🏆",
    defaultText: "There's the final whistle! A spectacular performance concludes as the players shake hands.",
    icon: "🏆",
    severity: "high"
  }
];
