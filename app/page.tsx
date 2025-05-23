'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, useContractRead, useDisconnect, useWatchContractEvent } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther } from 'viem';
import { DonationContractABI, CONTRACT_ADDRESS, RECIPIENT_ADDRESS } from './contracts/DonationContract';
import { baseSepolia } from 'wagmi/chains';

export default function Home() {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [totalDonations, setTotalDonations] = useState('0');
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Get total donations from Etherscan V2
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const response = await fetch(
          `https://api.etherscan.io/v2/api?chainid=84532&module=account&action=txlist&address=${CONTRACT_ADDRESS}&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY}`
        );
        const data = await response.json();
        if (data.result) {
          // Sum up all incoming transactions
          const total = data.result.reduce((acc: number, tx: any) => {
            if (tx.to?.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
              return acc + Number(tx.value);
            }
            return acc;
          }, 0);
          setTotalDonations(formatEther(BigInt(total)));
        }
      } catch (error) {
        console.error('Error fetching donations:', error);
      }
    };

    fetchDonations();
  }, []);

  // Listen for new donations
  useWatchContractEvent({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: DonationContractABI,
    eventName: 'DonationReceived',
    onLogs(logs) {
      if (logs[0]?.args?.amount) {
        const newAmount = logs[0].args.amount;
        setTotalDonations(prev => formatEther(BigInt(prev) + newAmount));
      }
    },
  });

  // Get contract's balance
  const { data: contractBalance } = useBalance({
    address: CONTRACT_ADDRESS as `0x${string}`,
    chainId: baseSepolia.id,
  });

  // Update total donations when contract balance changes
  useEffect(() => {
    if (contractBalance) {
      setTotalDonations(formatEther(contractBalance.value));
    }
  }, [contractBalance]);

  // Get recipient address from contract
  const { data: recipientAddress } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: DonationContractABI,
    functionName: 'RECIPIENT',
  });

  // Get user's ETH balance on Base Sepolia
  const { data: balance } = useBalance({
    address,
    chainId: baseSepolia.id,
  });

  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    chainId: baseSepolia.id,
  });

  // Update success message when transaction is confirmed
  useEffect(() => {
    if (isSuccess) {
      setSuccess('Thank you for your donation!');
      setAmount('');
    }
  }, [isSuccess]);

  const handleDonate = async () => {
    setError('');
    setSuccess('');

    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const donationAmount = parseEther(amount);
    
    // Check if user has enough balance
    if (balance && donationAmount > balance.value) {
      setError(`Insufficient balance. You have ${formatEther(balance.value)} ETH`);
      return;
    }

    try {
      const tx = await writeContract({
        abi: DonationContractABI,
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'donate',
        value: donationAmount,
      });

      setSuccess('Transaction sent! Waiting for confirmation...');
    } catch (error: any) {
      console.error('Donation failed:', error);
      if (error.message?.includes('user rejected')) {
        setError('Transaction was rejected. Please try again.');
      } else if (error.message?.includes('insufficient funds')) {
        setError('Insufficient funds for gas * price + value');
      } else {
        setError(error.message || 'Transaction failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-end mb-8">
          <ConnectButton />
        </header>

        <main className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Base Builder Fund
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
              Supporting the next generation of Base ecosystem builders
            </p>
            
            {/* Contract Info */}
            <div className="text-center mb-6 space-y-2">
              <p className="text-gray-600 dark:text-gray-300">
                Total Donations: {totalDonations} ETH
              </p>
            </div>
            
            {isConnected && balance && (
              <div className="text-center mb-6">
                <p className="text-gray-600 dark:text-gray-300">
                  Your Balance: {formatEther(balance.value)} ETH
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex gap-2 justify-center">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount in ETH"
                  className="w-48 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.001"
                  disabled={isPending || isConfirming}
                />
                <button
                  onClick={handleDonate}
                  disabled={isPending || isConfirming || !isConnected}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                    isPending || isConfirming
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isConnected
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isPending || isConfirming ? 'Processing...' : 'Donate'}
                </button>
              </div>
              
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              
              {success && (
                <p className="text-green-500 text-sm text-center">{success}</p>
              )}
              
              {!isConnected && (
                <p className="text-center text-gray-600 dark:text-gray-400">
                  Connect your wallet to support the Base Builder Fund
                </p>
              )}
            </div>

            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Built on Base Sepolia Testnet</p>
              <p className="mt-2">Your support helps us build the future of decentralized applications</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
