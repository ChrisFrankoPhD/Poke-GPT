// IMPORTS
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
const app = express();
dotenv.config({ path: "./.env" });
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/")));
}

// Sends API request to ChatGPT with the pokemon names and moves given by the POST route that received the info from the front end
async function getResponseFromChatGPT(pokeNames, randMoves) {
  console.log("in getResponseFromChatGPT function:");
  try {
    // get API key from environment
    const apiKey = process.env.chatApiKey;
    const url = `https://api.openai.com/v1/chat/completions`;
    // console.log(pokeNames);

    // construct request body with properties needed by ChatGPT, "content" is our custom prompt, model is the chat version to use, and temperature indicates the level of coherence vs creativity in the response, where 0 is the most coherent/conservative, and 1 is less coherent but more creative/random
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
    
    // construct the headers of the request
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${apiKey}`);
    
    // now sending the actual request to chatGPT
    const response = await fetch(url, {
      body: body,
      method: "POST",
      headers: myHeaders,
    });   
    const data = await response.json();
    // console.log("data:");
    // console.log(data);
    // console.log("data end.");

    // Handling common errors with the request and returning them to the user, if things went well we will get a regular response and return that
    if (data.error.type === 'insufficient_quota') {
       return "Sorry, the simulation limit of my wallet has been reached, please try again later"
    } else if (data.error.type === 'invalid_request_error') {
      return `Sorry ChatGPT was unable to get ${pokeNames[0]} and ${pokeNames[1]} to fight, they are too friendly, or there might be an API key issue, who's to say.`
    }
    const text = data.choices[0].message.content.trim();
    return text;
  } catch (err) {
    console.error(err.message);
  }
}

// MIDDLEWARE
app.use(express.json());

//ROUTES//
// single route, receives the pokemon data from the client and calls the getResponseFromChatGPT function with said data 
app.post("/api/", async (req, res) => {
  const { pokeNames, randMoves } = req.body;
  console.log(pokeNames);
  console.log(randMoves);
  const battleText = await getResponseFromChatGPT(pokeNames, randMoves);
  res.json(battleText);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Express server started on port ${PORT}`);
});
