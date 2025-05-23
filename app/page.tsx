'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, useWatchContractEvent } from 'wagmi';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { parseEther, formatEther } from 'viem';
import { DonationContractABI, CONTRACT_ADDRESS } from './contracts/DonationContract';
import { baseSepolia } from 'wagmi/chains';
import lighthouse from '@lighthouse-web3/sdk';
import Link from 'next/link';

interface TransactionError {
  message?: string;
}

export default function Home() {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [totalDonations, setTotalDonations] = useState('0');
  const [isUploading, setIsUploading] = useState(false);
  const hasUploaded = useRef(false);
  const { address, isConnected } = useAccount();

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
          const total = data.result.reduce((acc: number, tx: { to?: string; value: string }) => {
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

  // Update success message and handle upload when transaction is confirmed
  useEffect(() => {
    if (isSuccess && !hasUploaded.current) {
      hasUploaded.current = true;
      // Only upload to Lighthouse after successful transaction
      setIsUploading(true);
      const uploadToLighthouse = async () => {
        try {
          const response = await lighthouse.uploadText(
            JSON.stringify({
              name: name.trim(),
              message,
              timestamp: new Date().toISOString(),
              donor: address
            }),
            process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY || '',
            `donation-${name.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
          );

          if (!response.data?.Hash) {
            throw new Error('Failed to upload message to Lighthouse');
          }

          setSuccess('Thank you for your donation!');
          // Reset all form fields
          setAmount('');
          setMessage('');
          setName('');
        } catch (uploadError) {
          console.error('Lighthouse upload failed:', uploadError);
          setError('Donation successful but failed to save message. Please contact support.');
        } finally {
          setIsUploading(false);
        }
      };

      uploadToLighthouse();
    }
  }, [isSuccess, name, message, address]);

  const handleDonate = async () => {
    setError('');
    setSuccess('');
    hasUploaded.current = false; // Reset the upload flag when starting a new donation

    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!message || message.length < 50) {
      setError('Please enter a message with at least 50 characters');
      return;
    }

    if (!name || name.trim().length === 0) {
      setError('Please enter your name');
      return;
    }

    const donationAmount = parseEther(amount);
    
    // Check if user has enough balance
    if (!balance) {
      setError('Unable to fetch your balance. Please try again.');
      return;
    }

    if (donationAmount > balance.value) {
      setError(`Insufficient balance. You have ${formatEther(balance.value)} ETH`);
      return;
    }

    try {
      await writeContract({
        abi: DonationContractABI,
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'donate',
        value: donationAmount,
      });

      setSuccess('Transaction sent! Waiting for confirmation...');
    } catch (error) {
      const txError = error as TransactionError;
      console.error('Donation failed:', txError);
      if (txError.message?.includes('user rejected')) {
        setError('Transaction was rejected. Please try again.');
      } else if (txError.message?.includes('insufficient funds')) {
        setError('Insufficient funds for gas * price + value');
      } else {
        setError(txError.message || 'Transaction failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4 order-2 sm:order-1">
            <Link 
              href="/donors"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View Donors
            </Link>
          </div>
          <h1 className="text-2xl font-medium text-blue-500 order-1 sm:order-2">Base Builder Fund</h1>
          <div className="flex justify-end order-3">
            <Wallet>
              <ConnectWallet>
                <Avatar className="h-6 w-6" />
                <Name />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>
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
            
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isPending || isConfirming || isUploading}
                />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount in ETH"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.001"
                  disabled={isPending || isConfirming || isUploading}
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message (minimum 50 characters)"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                  disabled={isPending || isConfirming || isUploading}
                />
                <button
                  onClick={handleDonate}
                  disabled={isPending || isConfirming || isUploading || !isConnected || message.length < 50 || !name.trim()}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                    isPending || isConfirming || isUploading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isConnected && message.length >= 50 && name.trim()
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isPending || isConfirming ? 'Processing...' : isUploading ? 'Uploading Message...' : 'Donate'}
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
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs">
                  This is an independent demo project built by Dee. Not affiliated with or endorsed by Base or Coinbase.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
