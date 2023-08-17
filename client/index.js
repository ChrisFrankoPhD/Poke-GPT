// click handler for the simulate button on the page, that calls the pokeApi function
document.getElementById("fight-button").addEventListener("click", pokeApi);

// this function calls the list of all pokemon from the pokeApi, then picks two random pokemon from that list, the initial call is needed since the number of pokemon changes relatively frequently with games like pokemon GO, the function then passes the info to an HTML editor function, and to the chatGPT api
async function pokeApi() {
  console.log("event listener working");

  // collect initial pokeapi data
  const response = await fetch(
    "https://pokeapi.co/api/v2/pokemon?limit=10000&offset=0"
  );
  const data = await response.json();
  console.log(data);
  let pokeInfo = [];

  // picking two random pokemon, this is done in a while loop that ensures that both pokemon picked have valid move lists, pokemon with no movelists break the HTML updater
  while (true) {
    const randNum1 = Math.floor(Math.random() * data.results.length);
    const randNum2 = Math.floor(Math.random() * data.results.length);
    console.log(randNum1, randNum2);

    const pokeUrl1 = data.results[randNum1].url;
    const pokeUrl2 = data.results[randNum2].url;
    pokeInfo = await getPokeData(pokeUrl1, pokeUrl2);
    console.log(pokeInfo);
    if (pokeInfo[0].moves.length && pokeInfo[1].moves.length) {
      break;
    }
  }

  // pass the two pokemon infos to the HTML updater, initial an array of random moves that is filled by the HTML function when it picks the learnset, which is then passed to the chatGTP function so that it has access to the move list
  let randMoves = updatePokeHtml(pokeInfo);
  console.log(randMoves);
  const battle = await getBattleSim(
    [pokeInfo[0].name, pokeInfo[1].name],
    randMoves
  );
  console.log(battle);
  updateBattleHtml(battle);
}

// gets individual pokemon data using the random URLs, returns then in an array
async function getPokeData(pokeUrl1, pokeUrl2) {
  const response1 = await fetch(pokeUrl1);
  const data1 = await response1.json();
  const pokeInfo1 = data1;
  const response2 = await fetch(pokeUrl2);
  const data2 = await response2.json();
  const pokeInfo2 = data2;
  return [pokeInfo1, pokeInfo2];
  // const pokeList = [pokeInfo1, pokeInfo2]
  // console.log(pokeList)
  // return pokeList
}

// updates all of the relevant HTML in the pokemon cards using the returns json pokemon data
function updatePokeHtml(pokeInfo) {
  let randNums = ["", "", "", "", "", "", "", ""];
  console.log(pokeInfo[0]);
  document.getElementById("battle").innerText =
    "Simulating... May take up to 20 seconds to simulate battle";
  pokeInfo.forEach((pokemon, pokeIdx) => {
    // automatically setting the font size for the name div by setting up a dummy div to fit the font, and decreasing the font size until the dummy div is smaller than the name div, then setting the name at that font in the name div, this way it does not overfill ever
    const dummyDiv = document.getElementById("dummy-font-test");
    const nameDiv = document.getElementById(`poke-name-${pokeIdx}`);

    // get poke-name, and capiltalize first letter
    let capName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

    // getting width of pokemon name container div, and setting the variable for the dummy div, and putting the poke-name in the dummy div
    const nameDivWidth = nameDiv.clientWidth;
    dummyDiv.innerText = capName;

    // set initial variable for tracking the dummy width, adn set initial font size (in rem)
    let dummyDivWidth = dummyDiv.clientWidth;
    let initFont = 2.5;
    dummyDiv.style.fontSize = "2.5rem";

    // console.log(dummyDiv.style.fontSize);
    // console.log(dummyDivWidth, nameDivWidth);

    // console.log(dummyDivWidth > (nameDivWidth * 0.9))
    while (dummyDivWidth > nameDivWidth * 0.9) {
      initFont -= 0.1;
      dummyDiv.style.fontSize = `${initFont}rem`;
      dummyDivWidth = dummyDiv.clientWidth;
      // console.log(dummyDiv.style.fontSize);
      // console.log(dummyDiv.clientWidth);
    }
    // console.log(initFont)
    // console.log(dummyDiv.clientWidth)
    nameDiv.style.fontSize = `${initFont}rem`;

    // setting the pokemon name, sprite image, and background color for the card (based on first type)
    nameDiv.innerText = capName;
    document.getElementById(`poke-sprite-${pokeIdx}`).src =
      pokemon.sprites.front_default;
    document.getElementById(`poke-card-${pokeIdx}`).style.backgroundColor =
      colors[pokemon.types[0].type.name];

    // looping through types to make type list elements, while first setting the previous type innerText to empty, or else they carry over if the previous pokemon has 2 types and the new one has 1
    const typeElems = document.getElementById(`poke-type-${pokeIdx}`).children;
    for (i = 1; i < typeElems.length; i++) {
      typeElems[i].innerText = "";
    }
    pokemon.types.forEach((typeObj, typeIdx) => {
      document.getElementById(`type${typeIdx}-${pokeIdx}`).innerText =
        typeObj.type.name;
      document.getElementById(
        `type${typeIdx}-${pokeIdx}`
      ).style.backgroundColor = colors[`${typeObj.type.name}2`];
    });

    // looping through stats list to make basestats elements
    pokemon.stats.forEach((statObj, statIdx) => {
      document.getElementById(`stat${statIdx}-${pokeIdx}`).innerText =
        statObj.base_stat;
      document.getElementById(
        `stat${statIdx}-${pokeIdx}`
      ).style.backgroundColor = colors[`${pokemon.types[0].type.name}2`];
    });

    // generating a 4 item random move list from the list of moves
    const moveListLen = pokemon.moves.length;
    for (i = 0; i < 4; i++) {
      // console.log(i)
      const randIdx = Math.floor(Math.random() * moveListLen);
      const randMove = pokemon.moves[randIdx].move;
      document.getElementById(`move${i}-${pokeIdx}`).innerText = randMove.name;
      document.getElementById(`move${i}-${pokeIdx}`).style.backgroundColor =
        colors[`${pokemon.types[0].type.name}2`];

      randNums[i + pokeIdx * 4] = randMove.name;
    }
  });
  return randNums;
}

// function that calls the chatGPT API for the battle simulation
async function getBattleSim(pokeNames, randMoves) {
  const body = { pokeNames, randMoves };
  const response = await fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  console.log(data);
  const text = data[0];
  return text;
}

// update the text for the simulated battle
function updateBattleHtml(battleText) {
  document.getElementById("battle").innerText = battleText;
}

// type color map for the card and card section backgrounds
const colors = {
  normal: `#b5b595`,
  normal2: `#c9c9ad`,
  fire: `#e39053`,
  fire2: `#eea46d`,
  water: `#7c9bde`,
  water2: `#93b4fc`,
  electric: `#f6d549`,
  electric2: `#ECD36A`,
  grass: `#91c473`,
  grass2: `#96e766`,
  ice: `#97d8d5`,
  ice2: `#99e6e2`,
  fighting: `#bf4641`,
  fighting2: `#e65752`,
  poison: `#a455a2`,
  poison2: `#d36bd1`,
  ground: `#836d45`,
  ground2: `#a9906c`,
  flying: `#b7a2f2`,
  flying2: `#cab7ff`,
  psychic: `#f6789e`,
  psychic2: `#ff95b6`,
  bug: `#bbc954`,
  bug2: `#cad483`,
  rock: `#ab9e60`,
  rock2: `#bfb26f`,
  ghost: `#796b8b`,
  ghost2: `#8d79a7`,
  dragon: `#8a5cfa`,
  dragon2: `#9f7af7`,
  dark: `#525252`,
  dark2: `#606060`,
  steel: `#c1c1d8`,
  steel2: `#ccccee`,
  fairy: `#cb9bb2`,
  fairy2: `#dcb3c7`,
};
