# Solana on-chain multiplayer card game command line interface

#### This game runs on the devnet and serves as a simulator
##### Back end: https://github.com/francisy9/hs-card-game

To run:

`git clone https://github.com/francisy9/hs-cli.git`

(Navigate to this folder on your command line)

`npm i`

`node createKeypair.js`

`node index.js`

(`npm i` and `node createKeypair.js` only needs to be run on the first go)

Feel free to play around by changing the sample hands (near the top of `index.js`)


## How to Play
### Overview
One-versus-one game where you must take the health of opposing hero down from 30 to 0 to win

Attacking them directly with units on the board will reduce their health

Each player takes a turn to play any cards they wish and then attack the opposing hero directly or the minions they have on the board

Each card cost mana to play and your mana increases by 1 each turn up to 10

### Commands
All command examples will be be assumed to be player one's turn



#### Play Card: 

`p (card index) (row position)`

`p 0 4` will play player one's index 0 card onto the bottom row's index four position

Note: Playing cards expend mana, so you can only play cards your remaining mana allows (see show hand command)

You can only play cards onto your empty board spaces, i.e. player one cannot play units onto the top row.


#### Attack:

`a (ally row position) (enemy row position)` [To attack enemy hero use index 7]

`a 3 6` will use the bottom row's index 3 card to attack top row's index 6 unit

`a 0 7` will use bottom row's index 0 unit to attack enemy hero

Note: Units can only attack after they are played but they also need a turn to get ready (check `moves` attribute of unit)


#### End Turn:

`e`

`e` will end player one's turn and allow player two to take their turn


#### Print Board:

`pb`

`pb` will display the current board state alongside player health and mana


#### Show Hand:

`s`

`s` will show player one's remaining mana and cards in hand
