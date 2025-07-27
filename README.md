## Pharos Season 2 Automation Bot
A powerful and configurable automation script for interacting with multiple protocols on the Pharos testnet. This bot is designed to automate daily tasks across several wallets, including token swaps, liquidity provision, NFT minting, and social tipping.

## Features
This script provides a comprehensive suite of automation tools for the Pharos ecosystem:

## 💧 AquaFlux Protocol Automation:
Daily login to AquaFlux with a wallet signature.
Claims daily free C and S tokens.
Crafts CS tokens from the claimed C and S tokens.
Interacts with the AquaFlux API to get a signature for NFT minting.
Mints the AquaFlux NFT using the crafted CS tokens.

## 🦄 DODO DEX Swaps:
Performs automated swap cycles between PHRS, USDT, and USDC.
Fetches optimal routing from the DODO API.
Handles token approvals automatically.

## 💰 Add Liquidity:
Adds liquidity to the specified USDC/USDT pool on the DODO exchange.
Allows the user to specify the amount of tokens to add.

## 💸 Primus Social Tipping:
Sends small, randomized tips in PHRS to a specified X (formerly Twitter) username.

## ⚙️ Multi-Wallet & Configuration:
Supports multiple wallets loaded from a .env file.

Interactive command-line interface (CLI) to configure tasks for each run.
Customizable random delays between transactions to simulate human behavior.
Robust error handling and retry mechanisms for API calls.

Prerequisites
Before you begin, ensure you have the following installed:

Node.js (v16 or later is recommended)

npm (usually comes with Node.js)

## 🚀 Setup & Installation
Clone the Repository
```bash
git clone https://github.com/atczxc1-cell/Pharos-S2.git
cd Pharos-S2
```
## Install Dependencies
Run the following command to install the required Node.js packages:
```bash
npm install
```
This will install ethers, axios, dotenv, and other necessary libraries.

Security Note: Never share your .env file or commit it to a public repository.

## Run the Bot:
```bash
npm main.js
```


## Disclaimer
This script is provided for educational and experimental purposes only. The user assumes all risks associated with its use. The author is not responsible for any loss of funds or other damages that may occur.
