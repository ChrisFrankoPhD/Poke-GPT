import express from "express";
import dotenv from 'dotenv';
const app = express();
dotenv.config({path:"./.env"})
const port = 5000;

async function getResponseFromChatGPT(pokeNames, randMoves) {
    console.log("in getResponseFromChatGPT function:");
    try {
        const apiKey = process.env.chatApiKey;
        console.log(apiKey);
        const url = `https://api.openai.com/v1/chat/completions`;
        console.log(pokeNames)
        const response = await fetch(url, {
            body: JSON.stringify({
                "model": "gpt-3.5-turbo", 
                "messages": [{
                    "role": "user",
                    "content": `Narrate a short (less than 750 characters) pokemon battle between a ${pokeNames[0]}, who knows the moves: ${randMoves[0]}, ${randMoves[1]}, ${randMoves[2]}, and ${randMoves[3]}, and a ${pokeNames[1]} who knows the moves: ${randMoves[4]}, ${randMoves[5]}, ${randMoves[6]}, and ${randMoves[7]}.`
                }],
                "temperature": 0, 
            }),
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        });
    
        const data = await response.json();
        console.log(data)
        const text = data.choices[0].message.content.trim();
        return text;
    } catch (err) {
        console.error(err.message);
    }
}

// MIDDLEWARE
app.use(express.json());

//ROUTES//
app.post("/api/", async (req, res) => {
    const { pokeNames, randMoves } = req.body
    console.log(pokeNames);
    console.log(randMoves);
    const battleText = await getResponseFromChatGPT(pokeNames, randMoves)
    res.json(battleText)
})

// Start Server
app.listen(port, () => {
    console.log(`Express server started on port ${port}`);
}) 