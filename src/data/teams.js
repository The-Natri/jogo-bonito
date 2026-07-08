export const teams = [
  // National Teams
  {
    id: "brazil",
    name: "Brazil",
    emoji: "🇧🇷",
    type: "national",
    manager: "Dorival Júnior",
    preferredFormation: "4-3-3",
    stats: {
      quality: 91,
      value: 88,
      cohesion: 85,
      variation: 90
    },
    keyPlayers: [
      "Alisson (GK)", "Danilo (RB)", "Marquinhos (CB)", "Gabriel Magalhães (CB)", "Guilherme Arana (LB)",
      "Bruno Guimarães (CM)", "Casemiro (DM)", "Lucas Paquetá (CM)",
      "Rodrygo (RW)", "Vinícius Júnior (LW)", "Endrick (ST)"
    ],
    tacticalDescription: "Flamboyant attacking style built around high individual dribbling ability, fast winger transition, and dynamic fluid movements."
  },
  {
    id: "france",
    name: "France",
    emoji: "🇫🇷",
    type: "national",
    manager: "Didier Deschamps",
    preferredFormation: "4-2-3-1",
    stats: {
      quality: 93,
      value: 89,
      cohesion: 90,
      variation: 87
    },
    keyPlayers: [
      "Mike Maignan (GK)", "Benjamin Pavard (RB)", "William Saliba (CB)", "Ibrahima Konaté (CB)", "Théo Hernández (LB)",
      "Aurélien Tchouaméni (DM)", "Adrien Rabiot (DM)",
      "Ousmane Dembélé (RW)", "Antoine Griezmann (AM)", "Kylian Mbappé (LW)",
      "Olivier Giroud (ST)"
    ],
    tacticalDescription: "Direct, pragmatically structured transition play utilizing rapid speed on the wings, dynamic counter-attacks, and a robust mid-block defense."
  },
  {
    id: "argentina",
    name: "Argentina",
    emoji: "🇦🇷",
    type: "national",
    manager: "Lionel Scaloni",
    preferredFormation: "4-3-3",
    stats: {
      quality: 92,
      value: 91,
      cohesion: 94,
      variation: 88
    },
    keyPlayers: [
      "Emiliano Martínez (GK)", "Nahuel Molina (RB)", "Cristian Romero (CB)", "Lisandro Martínez (CB)", "Nicolás Tagliafico (LB)",
      "Rodrigo De Paul (CM)", "Enzo Fernández (CM)", "Alexis Mac Allister (CM)",
      "Lionel Messi (RW)", "Lautaro Martínez (ST)", "Ángel Di María (LW)"
    ],
    tacticalDescription: "Highly cohesive possession-based system featuring rapid combinations, defensive resilience, and tactical flexibility centered around creative playmakers."
  },
  {
    id: "england",
    name: "England",
    emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    type: "national",
    manager: "Thomas Tuchel",
    preferredFormation: "4-3-3",
    stats: {
      quality: 90,
      value: 87,
      cohesion: 84,
      variation: 86
    },
    keyPlayers: [
      "Jordan Pickford (GK)", "Kyle Walker (RB)", "John Stones (CB)", "Marc Guehi (CB)", "Luke Shaw (LB)",
      "Declan Rice (DM)", "Jude Bellingham (CM)", "Kobbie Mainoo (CM)",
      "Bukayo Saka (RW)", "Harry Kane (ST)", "Phil Foden (LW)"
    ],
    tacticalDescription: "Controlled possession with emphasis on defensive solidity, technical control in midfield, and lethal transitions via wing speed."
  },
  {
    id: "germany",
    name: "Germany",
    emoji: "🇩🇪",
    type: "national",
    manager: "Julian Nagelsmann",
    preferredFormation: "4-2-3-1",
    stats: {
      quality: 89,
      value: 90,
      cohesion: 88,
      variation: 91
    },
    keyPlayers: [
      "Manuel Neuer (GK)", "Joshua Kimmich (RB)", "Antonio Rüdiger (CB)", "Jonathan Tah (CB)", "David Raum (LB)",
      "Robert Andrich (DM)", "Pascal Groß (DM)",
      "Jamal Musiala (AM)", "Florian Wirtz (AM)", "Leroy Sané (RW)",
      "Kai Havertz (ST)"
    ],
    tacticalDescription: "High-intensity Gegenpressing and vertical passing combinations with flexible attacking midfielders occupying half-spaces."
  },
  {
    id: "spain",
    name: "Spain",
    emoji: "🇪🇸",
    type: "national",
    manager: "Luis de la Fuente",
    preferredFormation: "4-3-3",
    stats: {
      quality: 91,
      value: 93,
      cohesion: 92,
      variation: 89
    },
    keyPlayers: [
      "Unai Simón (GK)", "Dani Carvajal (RB)", "Aymeric Laporte (CB)", "Robin Le Normand (CB)", "Alejandro Grimaldo (LB)",
      "Rodri (DM)", "Fabián Ruiz (CM)", "Pedri (CM)",
      "Lamine Yamal (RW)", "Álvaro Morata (ST)", "Nico Williams (LW)"
    ],
    tacticalDescription: "Dominant positional play combined with dynamic vertical wing-attacks, quick ball circulation, and high counter-pressing."
  },
  {
    id: "portugal",
    name: "Portugal",
    emoji: "🇵🇹",
    type: "national",
    manager: "Roberto Martínez",
    preferredFormation: "4-2-3-1",
    stats: {
      quality: 90,
      value: 86,
      cohesion: 85,
      variation: 92
    },
    keyPlayers: [
      "Diogo Costa (GK)", "João Cancelo (RB)", "Rúben Dias (CB)", "Pepe (CB)", "Nuno Mendes (LB)",
      "Vitinha (DM)", "João Palhinha (DM)",
      "Bernardo Silva (RW)", "Bruno Fernandes (AM)", "Rafael Leão (LW)",
      "Cristiano Ronaldo (ST)"
    ],
    tacticalDescription: "Technical possession and width exploitation with fluid interchanging of front lines and aggressive overlapping fullbacks."
  },
  {
    id: "netherlands",
    name: "Netherlands",
    emoji: "🇳🇱",
    type: "national",
    manager: "Ronald Koeman",
    preferredFormation: "4-3-3",
    stats: {
      quality: 87,
      value: 86,
      cohesion: 86,
      variation: 88
    },
    keyPlayers: [
      "Bart Verbruggen (GK)", "Denzel Dumfries (RB)", "Virgil van Dijk (CB)", "Stefan de Vrij (CB)", "Nathan Aké (LB)",
      "Frenkie de Jong (CM)", "Teun Koopmeiners (CM)", "Tijjani Reijnders (CM)",
      "Donyell Malen (RW)", "Memphis Depay (ST)", "Cody Gakpo (LW)"
    ],
    tacticalDescription: "Total football roots emphasizing dynamic build-up play, expansive wingbacks, and strong central spine control."
  },
  // Club Teams
  {
    id: "real-madrid",
    name: "Real Madrid",
    emoji: "⚪",
    type: "club",
    manager: "Carlo Ancelotti",
    preferredFormation: "4-3-1-2",
    stats: {
      quality: 95,
      value: 92,
      cohesion: 93,
      variation: 94
    },
    keyPlayers: [
      "Thibaut Courtois (GK)", "Dani Carvajal (RB)", "Éder Militão (CB)", "Antonio Rüdiger (CB)", "Ferland Mendy (LB)",
      "Federico Valverde (CM)", "Aurélien Tchouaméni (CM)", "Luka Modrić (CM)",
      "Jude Bellingham (AM)",
      "Kylian Mbappé (ST)", "Vinícius Júnior (ST)"
    ],
    tacticalDescription: "Flexible system utilizing supreme individual quality, rapid transitions, and tactical freedom, capable of playing low block or possession."
  },
  {
    id: "barcelona",
    name: "Barcelona",
    emoji: "🔵🔴",
    type: "club",
    manager: "Hansi Flick",
    preferredFormation: "4-3-3",
    stats: {
      quality: 89,
      value: 92,
      cohesion: 91,
      variation: 88
    },
    keyPlayers: [
      "Marc-André ter Stegen (GK)", "Jules Koundé (RB)", "Ronald Araújo (CB)", "Andreas Christensen (CB)", "Alejandro Balde (LB)",
      "Frenkie de Jong (CM)", "Pedri (CM)", "Gavi (CM)",
      "Lamine Yamal (RW)", "Robert Lewandowski (ST)", "Raphinha (LW)"
    ],
    tacticalDescription: "High-pressing, high-defensive line approach featuring quick vertical transitions, structured positional play, and wing overloads."
  },
  {
    id: "manchester-city",
    name: "Manchester City",
    emoji: "🩵",
    type: "club",
    manager: "Pep Guardiola",
    preferredFormation: "4-3-3",
    stats: {
      quality: 94,
      value: 96,
      cohesion: 95,
      variation: 91
    },
    keyPlayers: [
      "Ederson (GK)", "Kyle Walker (RB)", "Rúben Dias (CB)", "Manuel Akanji (CB)", "Joško Gvardiol (LB)",
      "Rodri (DM)", "Kevin De Bruyne (CM)", "Bernardo Silva (CM)",
      "Phil Foden (RW)", "Erling Haaland (ST)", "Jack Grealish (LW)"
    ],
    tacticalDescription: "Intricate positional play (Juego de Posición) with inverted fullbacks, high sustained possession, counter-pressing, and wing isolation."
  },
  {
    id: "bayern-munich",
    name: "Bayern Munich",
    emoji: "🔴⚪",
    type: "club",
    manager: "Vincent Kompany",
    preferredFormation: "4-2-3-1",
    stats: {
      quality: 91,
      value: 90,
      cohesion: 88,
      variation: 89
    },
    keyPlayers: [
      "Manuel Neuer (GK)", "Benjamin Pavard (RB)", "Matthijs de Ligt (CB)", "Kim Min-jae (CB)", "Alphonso Davies (LB)",
      "Joshua Kimmich (DM)", "Leon Goretzka (DM)",
      "Leroy Sané (RW)", "Jamal Musiala (AM)", "Serge Gnabry (LW)",
      "Harry Kane (ST)"
    ],
    tacticalDescription: "High-intensity aggressive pressing, expansive attacking wingbacks, and dominant central playmaking in opposition territory."
  },
  {
    id: "liverpool",
    name: "Liverpool",
    emoji: "🔴",
    type: "club",
    manager: "Arne Slot",
    preferredFormation: "4-3-3",
    stats: {
      quality: 92,
      value: 91,
      cohesion: 92,
      variation: 90
    },
    keyPlayers: [
      "Alisson (GK)", "Trent Alexander-Arnold (RB)", "Virgil van Dijk (CB)", "Joël Matip (CB)", "Andrew Robertson (LB)",
      "Alexis Mac Allister (CM)", "Dominik Szoboszlai (CM)", "Curtis Jones (CM)",
      "Mohamed Salah (RW)", "Darwin Núñez (ST)", "Luis Díaz (LW)"
    ],
    tacticalDescription: "Controlled directness with aggressive counter-pressing (Gegenpressing), inverted fullbacks providing playmaker roles, and lightning-fast transitions."
  }
];
