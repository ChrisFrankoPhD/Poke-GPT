# Poke-GPT

- Uses OpenAIs ChatGPT API and PokeAPI to simulate random Pokémon battles given two random Pokémon, each with 4 different moves randomly selected from their move list

## Contents

- [Description](#description)
- [Usage](#using-the-app--program-flow)
    - [Get Data](#getting-pokemon-data)
    - [Update HTML](#updating-html)
    - [Simulate](#simulating-battle)
    - [Backend](#backend-openai-request)
- [Next Steps](#whats-next)
- [Credit](#credit)

## Description 

- This app uses pure JS on the front end to make API calls to both PokeAPI (to get pokemon info) and then to the backend
- The backend is a simple single express route that makes an API call to the OpenAI ChatGPT API, and return the resulting text to the front end

## Using the App & Program Flow

- Usage is very simple as there is only a single button, but there is a decent amount of JS going on behind the scenes when that button is clicked

    ### Getting pokemon Data

    - When the button is clicked, the `pokeAPI` function is called, which makes a request to the pokeAPI to get the list of all pokemon, this was done in order to ensure the app always has access to all pokemon when new ones are added
    - 2 random numbers are chosen between 1 and the returned pokemon list length
    - These numbers are used to access the API URLs for two pokemon with teh corresponding ID numbers
    - The `getPokeData` function is called, where the PokeAPI is called again twice with these new URLs
        ```
        async function getPokeData(pokeUrl1, pokeUrl2) {
            const response1 = await fetch(pokeUrl1);
            const pokeInfo1 = await response1.json();
            const response2 = await fetch(pokeUrl2);
            const pokeInfo2 = await response2.json();
            return [pokeInfo1, pokeInfo2];
        }
        ```
    - The returned pokemon data is checked to ensure they have a properly formatted move-set, since a small percentage of the entries in the API database are for different forms of the same pokemon, which do not have proper move data, and proper move data is needed for the ChatGPT simulation
        - If this check fails then the random number process is looped until we pass
    
    ### Updating HTML 

    - The new pokemon data is passed to the `updatePokeHtml`, which manually updates the HTML for the page with new pokemon data, the `updatePokeHtml` will return a random `moveList` that we will need to pass to chatGPT
    - The first update is to the ChatGPT simulation box with a message indicating the simulation has started
    - The pokemon names are then updated, which is non-trivial given the varying lengths of the names
        - An invisible dummy div, absolutely positioned at the end of the page, is used to decide the font size needed for the pokemon name
        - We take the pokemon name and put it in the dummy div with an initial maximum font size, we then measure the width of the dummy div and compare it to the width of the actual name div where we want to eventally place the pokemon name
        - If the dummy div is wider than the name div at this font size, we decrease the font size by some small amount, and re-compare the widths of the divs. The dummy div should shrink as the font size is decreased with each loop
        - Once the dummy div is the incrementally smaller than the proper name div, we then set the name div font size to the found value, and add the pokemon name to the name div to be displayed
        ```
        while (dummyDivWidth > nameDivWidth * 0.9) {
            initFont -= 0.1;
            dummyDiv.style.fontSize = `${initFont}rem`;
            dummyDivWidth = dummyDiv.clientWidth;
        }
        nameDiv.style.fontSize = `${initFont}rem`;
        ```
    - We then set the `src` value of the `<img>` element that we want to put the pokemon's picture in as the URL to the image sprite given by the API
    - We then set the color of the pokemon card that we are making to be the color that corresponds to the pokemon's primary type, as found in our `colors` object defined at the bottom of the JS file  
    - We then set the HTML for the type names, which involves resetting all previous type containers to be empty, and then looping through the pokemon types and creating a new type container for each type, since pokemon can have varying number of types
    - Lastly, we use a loop to select 4 random numbers from 0 to the pokemon's move list length, and use these to select 4 random moves from said move list. We then fill the move container's HTML with the move names, while also adding these moves to a master `moveList` so that we can send these to chatGPT for the simulation
    - `moveList` is returned back to the parent `pokeAPI` function

    ### Simulating Battle

    - `pokeAPI` then calls the function `getBattleSim` with the pokemon names and random move list, 
    - `getBattleSim` makes a POST request to the backend server with a body composed of the pokemon information:
    ```
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
        return data;
    }
    ```
    - the backend will call the chatGPT API (outlined below), and return the response from chatGPT here, this is then returned to the parent `pokeAPI` function 
    - `pokeAPI` then calls `updateBattleHtml` which simply takes the text from the chatGPT response and adds it to the HTML to be displayed to the user

    ### Backend OpenAI Request

    - The backend just a single express route, "/api/", which accepts the incoming request from the front-end and calls an asynchronous `getResponseFromChatGPT` function which does the actual API call to chatGPT
    - The function builds a request using a hidden OpenAI API key, and a constructed `body` and `headers` object:
    ```
    const body = JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Narrate a short (less than 750 characters) pokemon battle between a ${pokeNames[0]}, who knows the moves: ${randMoves[0]}, ${randMoves[1]}, ${randMoves[2]}, and ${randMoves[3]}, and a ${pokeNames[1]} who knows the moves: ${randMoves[4]}, ${randMoves[5]}, ${randMoves[6]}, and ${randMoves[7]}.`,
        },
      ],
      temperature: 0,
    });

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${apiKey}`);
    ```
    - The function then tests the reply from OpenAI to deal with any errors that may occur, such as the account reaching its request limit or an invalid API key
    - The response text is then returned to the original POST request handler function, and further is added to the response back to the front-end
    
## What's Next?

- Currently there is a hard limit on requests to OpenAI that resets on September 1st due to the paid nature of the API, the simulation behavior will reactivate then
- Want to add the ability to select Pokémon and their move-sets

## Credit

- This project relies heavily on the free and well-structured PokeAPI (https://pokeapi.co/) 
- I learnt the basic use of APIs and manual HTML manipulation with JS from Kalob Taulien in the 2023 Ultimate Web Developer Bootcamp on Udemy

