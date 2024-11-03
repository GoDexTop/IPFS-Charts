
    
        const { ethers } = window;  
        const provider = new ethers.providers.JsonRpcProvider('https://rpc-pulsechain.g4mm4.io');
        const contractAddress = '0x2221EEa96821E537F100C711dE439F79451c6A01';
        const wplsAddress = '0xa1077a294dde1b09bb078844df40758a5d0f9a27';
        const tokenAddress = '0x57953dAC106a4cDa11D90273b1B9D59E169533c0';
        const stablecoinAddress = '0xefD766cCb38EaF1dfd701853BFCe31359239F305';
        const hexAddress = '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39';
        const plsxAddress = '0x95B303987A60C71504D99Aa1b13B4DA07b0790ab';
        const incAddress = '0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d';
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const tokenABI = [
            {
                "constant": true,
                "inputs": [
                    {
                        "name": "_owner",
                        "type": "address"
                    }
                ],
                "name": "balanceOf",
                "outputs": [
                    {
                        "name": "balance",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            }
        ];
        
        let historicalPriceData = JSON.parse(localStorage.getItem('historicalPriceData')) || [];
let previousPrice = 0;
let myChart = null;


const timeFrames = ['daily', 'weekly', 'monthly'];
let currentIndex = 0;

async function fetchAndDisplayPrice() {
    try {
        document.getElementById('loader').style.display = 'block';

        const amounts = await contract.getAmountsOut(ethers.utils.parseEther('1'), [tokenAddress, stablecoinAddress]);
        const priceInStablecoin = amounts[amounts.length - 1].toString();
        const priceInEther = ethers.utils.formatEther(priceInStablecoin);
        const currentPrice = parseFloat(priceInEther).toFixed(12);

        previousPrice = currentPrice;
        historicalPriceData.push({ timestamp: new Date().toISOString(), price: currentPrice });
        localStorage.setItem('historicalPriceData', JSON.stringify(historicalPriceData));

        document.getElementById('priceDisplay').innerHTML = `Current Price: $ ${currentPrice}`;

        updateChart();

        document.getElementById('loader').style.display = 'none';
    } catch (error) {
        console.error('Error fetching and displaying price:', error);
    }
}

function updateChart() {
    let filteredData;

    if (timeFrames[currentIndex] === 'daily') {
        
        const currentTime = new Date();
        const twentyFourHoursAgo = new Date(currentTime - 24 * 60 * 60 * 1000); 

        filteredData = historicalPriceData.filter(data => new Date(data.timestamp) >= twentyFourHoursAgo);
    } else {
        
        filteredData = historicalPriceData;
    }

    
    if (filteredData.length === 0) {
        // Clear the chart if no data
        if (myChart) {
            myChart.destroy();
            myChart = null;
        }
        document.getElementById('priceDisplay').innerHTML = 'No data available for this time frame.';
        return; 
    }

    const dates = filteredData.map(data => {
        const timestamp = new Date(data.timestamp);
        return timestamp.toLocaleString();
    });
    const prices = filteredData.map(data => parseFloat(data.price));

    let percentageChange = 0;
    let emoji = '';
    if (filteredData.length >= 2) {
        const firstPrice = parseFloat(filteredData[0].price);
        const lastPrice = parseFloat(filteredData[filteredData.length - 1].price);
        const change = lastPrice - firstPrice;
        percentageChange = (change / firstPrice) * 100;

        if (percentageChange > 0) {
            emoji = '🚀';
        } else if (percentageChange < 0) {
            emoji = '📉';
        } else {
            emoji = '➡️';
        }
    }

    document.getElementById('priceDisplay').innerHTML = `Current Price: $ ${prices[prices.length - 1]}<br> | ${percentageChange.toFixed(2)}% ${emoji}`;

    if (!myChart) {
        const ctx = document.getElementById('priceChart').getContext('2d');
        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Token Price',
                    data: prices,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderColor: '#22ca00',
                    borderWidth: 1,
                    fill: false
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            color: 'white',
                            callback: function (value) {
                                return '$ ' + value.toFixed(12);
                            }
                        },
                        grid: {
                            color: 'rgba(128, 128, 128, 0.4)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(128, 128, 128, 0.4)'
                        },
                        display: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function (tooltipItem) {
                                if (tooltipItem && tooltipItem.parsed.y !== undefined) {
                                    return '$ ' + tooltipItem.parsed.y.toFixed(12);
                                }
                                return '';
                            }
                        }
                    }
                }
            }
        });
    } else {
       
        myChart.data.labels = dates; 
        myChart.data.datasets[0].data = prices;
        myChart.update();
    }
}


document.getElementById('change').addEventListener('click', function () {
 
    currentIndex = (currentIndex + 1) % timeFrames.length;

  
    this.textContent = timeFrames[currentIndex].charAt(0).toUpperCase() + timeFrames[currentIndex].slice(1);

    
    updateChart();
});



fetchAndDisplayPrice();
setInterval(fetchAndDisplayPrice, 300000); 
        function saveAddress() {
            const ethereumAddress = document.getElementById('ethereumAddress').value;
            localStorage.setItem('ethereumAddress', ethereumAddress);
            fetchPortfolioValue(ethereumAddress);
        }  
async function fetchPortfolioValue(address) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
        const tokenBalance = await tokenContract.balanceOf(address);
        const formattedPrice = await getTokenPrice();
        const portfolioValue = tokenBalance.mul(formattedPrice).div(ethers.utils.parseEther('1')).toString();
        const formattedTokenBalance = parseFloat(ethers.utils.formatEther(tokenBalance)).toFixed(2);
        const formattedPortfolioValue = parseFloat(ethers.utils.formatEther(portfolioValue)).toFixed(2);
        document.getElementById('portfolioDisplay').textContent = `Balance: ${formattedTokenBalance} | Value: $ ${formattedPortfolioValue}`;
    } catch (error) {
        console.error('Error fetching portfolio value:', error);
    }
}
async function getTokenPrice() {
    const amounts = await contract.getAmountsOut(ethers.utils.parseEther('1'), [tokenAddress, stablecoinAddress]);
    return amounts[amounts.length - 1];
}
const savedAddress = localStorage.getItem('ethereumAddress');
if (savedAddress) {
    fetchPortfolioValue(savedAddress);
}
        fetchAndDisplayPrice();
        setInterval(fetchAndDisplayPrice, 60000);
		
     
  

    let accountAddress = '';

async function toggleConnectWallet() {
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        accountAddress = accounts[0];
        document.getElementById('connectWalletButton').textContent = formatAccountAddress(accountAddress);
        document.getElementById('connectWalletButton').classList.add('connected');
        isConnected = true;

        await switchToPulseChain(); 
    } catch (error) {
        console.error('Error toggling wallet connection:', error);
        showErrorAlert('Error toggling wallet connection', error.message);
    }
}

async function switchToPulseChain() {
    const pulseChainParams = {
        chainId: '0x171', 
        chainName: 'PulseChain',
        nativeCurrency: {
            name: 'Pulse',
            symbol: 'PLS',
            decimals: 18
        },
        rpcUrls: ['https://rpc-pulsechain.g4mm4.io'],
        blockExplorerUrls: ['https://scan.pulsechain.com/']
    };

    try {
        await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: pulseChainParams.chainId }]
        });

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log('Connected wallet to PulseChain:', accounts[0]);
    } catch (switchError) {
        
        if (switchError.code === 4902) {
            try {
                await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [pulseChainParams]
                });

                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                console.log('PulseChain network added and wallet connected:', accounts[0]);
            } catch (addError) {
                console.error('Error adding PulseChain network:', addError);
                showErrorAlert('Failed to add PulseChain network', addError.message);
            }
        } else {
            console.error('Error switching to PulseChain network:', switchError);
            showErrorAlert('Failed to switch to PulseChain network', switchError.message);
        }
    }
}

document.getElementById('connectWalletButton').addEventListener('click', toggleConnectWallet);


function formatAccountAddress(account) {
    if (!account || typeof account !== 'string' || account.length < 4) {
        return 'Invalid address';
    }
    const end = account.substring(account.length - 4);
    return `0x...${end}`;
}


function showSuccessAlert(title, message) {
    Swal.fire({
        icon: 'success',
        title: title,
        text: message
    });
}


function showErrorAlert(title, message) {
    Swal.fire({
        icon: 'error',
        title: title,
        text: message
    });
}


  
function handleInputChange() {
    const amountToSwapInput = document.getElementById('buyAmount').value.trim();
    const selectedToken = document.getElementById('tokenSelect').value;

    if (!amountToSwapInput || isNaN(amountToSwapInput) || parseFloat(amountToSwapInput) <= 0) {
       
        document.getElementById('expected').textContent = '';
        return;
    }

   
    setTimeout(async () => {
        try {
            const rpcProvider = new ethers.providers.JsonRpcProvider('https://rpc-pulsechain.g4mm4.io');
            const routerContract = new ethers.Contract(contractAddress, contractABI, rpcProvider);

            const amountOut = await getAmountOut(selectedToken, amountToSwapInput, routerContract);

            if (amountOut === false) {
                console.error('Error calculating expected amount.');
                showErrorAlert('Error calculating expected amount', 'Please try again.');
                return;
            }


            const formattedExpectedAmountOut = ethers.utils.formatUnits(amountOut, 18); 
            const formattedAmountWithLabels = `${parseFloat(formattedExpectedAmountOut).toFixed(4)}`;
            document.getElementById('expected').textContent = formattedAmountWithLabels;
        } catch (error) {
            console.error('Error fetching expected amount:', error);
            showErrorAlert('Error fetching expected amount', 'Please try again.');
        }
    }, 2000); 
}


document.getElementById('buyAmount').addEventListener('input', handleInputChange);


document.getElementById('tokenSelect').addEventListener('change', async () => {
    try {
        const amountToSwapInput = document.getElementById('buyAmount').value.trim();
        const selectedToken = document.getElementById('tokenSelect').value;

        if (!amountToSwapInput || isNaN(amountToSwapInput) || parseFloat(amountToSwapInput) <= 0) {
        
            document.getElementById('expected').textContent = '';
            return;
        }

       
        updateExpectedAmount(selectedToken, amountToSwapInput);

    } catch (error) {
        console.error('Error fetching expected amount:', error);
        showErrorAlert('Error fetching expected amount', 'Please try again.');
    }
});


async function updateExpectedAmount(selectedToken, amountToSwapInput) {
    try {
        const rpcProvider = new ethers.providers.JsonRpcProvider('https://rpc-pulsechain.g4mm4.io');
        const routerContract = new ethers.Contract(contractAddress, contractABI, rpcProvider);

        const amountOut = await getAmountOut(selectedToken, amountToSwapInput, routerContract);

        if (amountOut === false) {
            console.error('Error calculating expected amount.');
            showErrorAlert('Error calculating expected amount', 'Please try again.');
            return;
        }

      
        const formattedExpectedAmountOut = ethers.utils.formatUnits(amountOut, 18);
        let formattedAmountWithLabels;
        
        if (selectedToken === 'tokenA') {
            formattedAmountWithLabels = `DEX : ${parseFloat(formattedExpectedAmountOut).toFixed(4)}`;
        } else if (selectedToken === 'tokenB') {
            formattedAmountWithLabels = `PLS : ${parseFloat(formattedExpectedAmountOut).toFixed(4)}`;
        }

        document.getElementById('expected').textContent = formattedAmountWithLabels;

    } catch (error) {
        console.error('Error fetching expected amount:', error);
        showErrorAlert('Error fetching expected amount', 'Please try again.');
    }
}


async function getAmountOut(selectedToken, amountIn, routerContract) {
    try {
        let path;
        if (selectedToken === 'tokenA') {
            path = [wplsAddress, tokenAddress];
        } else {
            path = [tokenAddress, wplsAddress];
        }
        const amountOut = await routerContract.getAmountsOut(
            ethers.utils.parseUnits(String(amountIn), 18),  
            path
        );
        return amountOut[1]; 
    } catch (error) {
        console.error('Error in getAmountOut:', error);
        return false;
    }
}


function showErrorAlert(title, text) {
    Swal.fire({
        icon: 'error',
        title: title,
        text: text
    });
}


function showConnectWalletAlert() {
    Swal.fire({
        icon: 'warning',
        title: 'Connect Your Wallet',
        text: 'Please connect your wallet to perform this action.'
    });
}



async function approveToken(token, amount, spender, signer) {
    try {
        const amountInToken = ethers.utils.parseUnits(amount, 18); 
        const currentAllowance = await token.allowance(await signer.getAddress(), spender);

        if (currentAllowance.lt(amountInToken)) {
            const tx = await token.approve(spender, amountInToken);
            const receipt = await tx.wait();
            console.log('Approval successful. Transaction receipt:', receipt);
            showSuccessAlert('Approval Successful', 'Transaction Hash: ' + receipt.transactionHash);
            return true;
        } else {
            console.log('Sufficient allowance for transfer exists.');
            return true; 
        }
    } catch (error) {
        console.error('Error approving token:', error);
        showErrorAlert('Error approving token', 'Please try again.');
        return false;
    }
}


async function swapTokens(selectedToken, amount, routerContract, accountAddress, signer) {
    const amountInToken1 = ethers.utils.parseUnits(amount, 18); 

    try {
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; 
        let tx;

        if (selectedToken === 'tokenA') {
            tx = await routerContract.swapExactETHForTokens(
                amountInToken1, [wplsAddress, tokenAddress], accountAddress, deadline, { value: amountInToken1 }
            );
        } else if (selectedToken === 'tokenB') {
            const token1 = new ethers.Contract(tokenAddress, erc20ABI, signer);

            const approvalSuccessful = await approveToken(token1, amount, contractAddress, signer);
            if (!approvalSuccessful) return; // Exit if approval fails

            const amountOut = await routerContract.callStatic.getAmountsOut(amountInToken1, [tokenAddress, wplsAddress]);
            tx = await routerContract.swapExactTokensForETH(
                amountInToken1, amountOut[1], [tokenAddress, wplsAddress], accountAddress, deadline
            );
        }

        const receipt = await tx.wait();
        console.log('Transaction successful. Transaction receipt:', receipt);
        showSuccessAlert('Transaction Successful', 'Transaction receipt: ' + JSON.stringify(receipt));

    } catch (error) {
        console.error('Error swapping tokens:', error);
        if (error.code === 'UNSUPPORTED_OPERATION' && error.message.includes('network does not support ENS')) {
            showConnectWalletAlert();
        } else {
            showErrorAlert('Error swapping tokens', 'Please try again.');
        }
    }
}


document.getElementById('swapButton').addEventListener('click', async () => {
    try {
        const amountToSwapInput = document.getElementById('buyAmount').value.trim();
        const selectedToken = document.getElementById('tokenSelect').value;

        if (!amountToSwapInput || isNaN(amountToSwapInput) || parseFloat(amountToSwapInput) <= 0) {
            showErrorAlert('Invalid amount', 'Please enter a valid amount to swap.');
            return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        
        let accountAddress;
        try {
            accountAddress = await signer.getAddress();
        } catch (walletError) {
            showConnectWalletAlert();
            return;
        }

        const routerContract = new ethers.Contract(contractAddress, contractABI, signer);

        await swapTokens(selectedToken, amountToSwapInput, routerContract, accountAddress, signer);

    } catch (error) {
        console.error('Error swapping tokens:', error);
        showErrorAlert('Error swapping tokens', 'Please try again.');
    }
});


function formatAccountAddress(account) {
    if (!account || typeof account !== 'string' || account.length < 4) {
        return 'Invalid address';
    }
    const end = account.substring(account.length - 4);
    return `0x...${end}`;
}


function showSuccessAlert(title, message) {
    Swal.fire({
        icon: 'success',
        title: title,
        text: message
    });
}


function showErrorAlert(title, message) {
    Swal.fire({
        icon: 'error',
        title: title,
        text: message
    });
}


function showConnectWalletAlert() {
    Swal.fire({
        icon: 'warning',
        title: 'Connect Your Wallet',
        text: 'Please connect your wallet to perform this action.'
    });
}









