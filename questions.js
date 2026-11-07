/*
  QUESTION BANK
  -------------
  Edit this file to add, remove or change questions.
  Each section has an "example" (shown on the How to Play screen) and a "pool".
  At the start of a game, questions are drawn at random from each pool
  (up to the "Questions per section" setting), so a bigger pool means more variety.

  Picture questions: use "image" for a picture file in the images/ folder,
  e.g. image: "images/red-sea.jpg", or "emoji" for an emoji puzzle.
  "clue" (optional) is a caption shown under the image to help teams guess.
  The included pictures come from Wikimedia Commons; see images/CREDITS.md
  for authors and licences.
  "hint" is shown with the answer to explain the clue.
  "alt" lists other answers the moderator should also accept.
*/

window.GAME_SECTIONS = [
  {
    id: "pictures",
    title: "Guess the Book",
    subtitle: "Name the book of the Bible from the picture",
    howTo: [
      "A picture appears on screen. It is either a pun on the book's name (a calculator for Numbers) or a famous scene from that book.",
      "The team whose turn it is names the book of the Bible before the timer runs out.",
      "If they miss, the other team gets a bonus try."
    ],
    example: { image: "images/numbers-calculator.jpg", answer: "Numbers", hint: "A calculator is all about numbers" },
    pool: [
      { image: "images/hebrews-coffee-brewing.jpg", answer: "Hebrews", hint: "He brews coffee: He-brews" },
      { image: "images/job-now-hiring.jpg", answer: "Job", hint: "Now hiring: there's a job" },
      { image: "images/mark-storm.jpg", answer: "Mark", alt: ["Matthew", "Luke"], hint: "Jesus calms the storm (Mark 4)" },
      { image: "images/romans-colosseum.jpg", answer: "Romans", hint: "The Colosseum in Rome" },
      { image: "images/kings-chess-king.jpg", answer: "1 Kings", alt: ["2 Kings"], hint: "The king in chess" },
      { image: "images/judges-gavel.jpg", answer: "Judges", hint: "A judge's gavel" },
      { image: "images/acts-stage.jpg", answer: "Acts", hint: "Actors performing an act" },
      { image: "images/exodus-passover.jpg", answer: "Exodus", hint: "The Passover: blood on the doorposts" },
      { image: "images/psalms-music.jpg", answer: "Psalms", hint: "The Bible's songbook" },
      { image: "images/genesis-earth.jpg", answer: "Genesis", hint: "In the beginning God created the earth" },
      { image: "images/proverbs-ant.jpg", answer: "Proverbs", hint: "Go to the ant, consider its ways and be wise (Proverbs 6:6)" },
      { image: "images/ecclesiastes-hourglass.jpg", answer: "Ecclesiastes", hint: "A time for everything" },
      { image: "images/esther-crown.jpg", answer: "Esther", hint: "The queen who saved her people" },
      { image: "images/jonah-whale.jpg", answer: "Jonah", hint: "Swallowed by a great fish" },
      { image: "images/daniel-lions-den.jpg", answer: "Daniel", hint: "Daniel in the lions' den" },
      { image: "images/exodus-red-sea.jpg", answer: "Exodus", hint: "Moses parts the Red Sea" },
      { image: "images/joshua-spies-grapes.jpg", answer: "Joshua", alt: ["Numbers"], hint: "Joshua and Caleb spy out the land of milk and honey (Numbers 13)" },
      { image: "images/ruth-naomi.jpg", answer: "Ruth", hint: "Ruth stays with Naomi" },
      { image: "images/revelation-four-horsemen.jpg", answer: "Revelation", hint: "The four horsemen" }
    ]
  },
  {
    id: "pairs",
    title: "Bible Pairs",
    subtitle: "Complete the famous Bible pair",
    howTo: [
      "One name is shown, followed by a blank.",
      "The team whose turn it is fills in the missing name of their famous partner.",
      "If they miss, the other team gets a bonus try."
    ],
    example: { first: "Abraham", answer: "Sarah" },
    pool: [
      { first: "Isaac", answer: "Rebekah" },
      { first: "Jacob", answer: "Rachel", alt: ["Leah"] },
      { first: "Adam", answer: "Eve" },
      { first: "Boaz", answer: "Ruth" },
      { first: "Joseph", answer: "Mary", hint: "Joseph of Nazareth" },
      { first: "Aquila", answer: "Priscilla" },
      { first: "Ananias", answer: "Sapphira" },
      { first: "Elkanah", answer: "Hannah", alt: ["Peninnah"] },
      { first: "Ahab", answer: "Jezebel" },
      { first: "Zechariah", answer: "Elizabeth" },
      { first: "Moses", answer: "Zipporah", alt: ["Aaron (his brother)"] },
      { first: "Hosea", answer: "Gomer" },
      { first: "Samson", answer: "Delilah" },
      { first: "David", answer: "Bathsheba", alt: ["Michal", "Abigail", "Jonathan (friend)", "Goliath"] },
      { first: "Cain", answer: "Abel" },
      { first: "Paul", answer: "Silas", alt: ["Barnabas"] },
      { first: "Shadrach, Meshach", answer: "Abednego" },
      { first: "Mary", answer: "Martha", hint: "Sisters of Lazarus", alt: ["Joseph"] }
    ]
  },
  {
    id: "scramble",
    title: "Scrambled Names",
    subtitle: "Unscramble the Bible name or book",
    howTo: [
      "The letters of a Bible character's name, or a one-word book of the Bible, are scrambled.",
      "The team whose turn it is unscrambles the word before the timer runs out.",
      "If they miss, the other team gets a bonus try."
    ],
    example: { scrambled: "SMEOS", answer: "Moses" },
    pool: [
      { scrambled: "VADDI", answer: "David" },
      { scrambled: "OHAN", answer: "Noah" },
      { scrambled: "PHESOJ", answer: "Joseph" },
      { scrambled: "HERTES", answer: "Esther" },
      { scrambled: "LEDAIN", answer: "Daniel" },
      { scrambled: "MULSEA", answer: "Samuel" },
      { scrambled: "HAJILE", answer: "Elijah" },
      { scrambled: "DONGIE", answer: "Gideon" },
      { scrambled: "MIMRAI", answer: "Miriam" },
      { scrambled: "MOLSONO", answer: "Solomon" },
      { scrambled: "THAGOIL", answer: "Goliath" },
      { scrambled: "HONAJ", answer: "Jonah" },
      { scrambled: "TREPE", answer: "Peter" },
      { scrambled: "THRAMA", answer: "Martha" },
      { scrambled: "ZURALAS", answer: "Lazarus" },
      { scrambled: "MOINA", answer: "Naomi" },
      { scrambled: "SNOMAS", answer: "Samson" },
      { scrambled: "ROBDEAH", answer: "Deborah" },
      { scrambled: "SEGNISE", answer: "Genesis", hint: "Book of the Bible" },
      { scrambled: "DUSOXE", answer: "Exodus", hint: "Book of the Bible" },
      { scrambled: "CULIVESIT", answer: "Leviticus", hint: "Book of the Bible" },
      { scrambled: "BREMSUN", answer: "Numbers", hint: "Book of the Bible" },
      { scrambled: "GUDJES", answer: "Judges", hint: "Book of the Bible" },
      { scrambled: "SLAMPS", answer: "Psalms", hint: "Book of the Bible" },
      { scrambled: "BROVERPS", answer: "Proverbs", hint: "Book of the Bible" },
      { scrambled: "HAIIAS", answer: "Isaiah", hint: "Book of the Bible" },
      { scrambled: "CHAMIAL", answer: "Malachi", hint: "Book of the Bible" },
      { scrambled: "HATTMEW", answer: "Matthew", hint: "Book of the Bible" },
      { scrambled: "MASRON", answer: "Romans", hint: "Book of the Bible" },
      { scrambled: "TALIGASNA", answer: "Galatians", hint: "Book of the Bible" },
      { scrambled: "BREWHES", answer: "Hebrews", hint: "Book of the Bible" },
      { scrambled: "VALETORNIE", answer: "Revelation", hint: "Book of the Bible" }
    ]
  }
];
