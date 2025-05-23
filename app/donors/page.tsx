'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import lighthouse from '@lighthouse-web3/sdk';

interface Donation {
  name: string;
  message: string;
  timestamp: string;
  donor: string;
  fileName: string;
}

export default function DonorsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const response = await lighthouse.getUploads(process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY || '');
        
        if (response.data?.fileList) {
          // Filter files that start with "donation-"
          const donationFiles = response.data.fileList.filter((file: any) => 
            file.fileName.startsWith('donation-')
          );

          // Fetch content for each donation file
          const donationPromises = donationFiles.map(async (file: any) => {
            try {
              const response = await fetch(`https://gateway.lighthouse.storage/ipfs/${file.cid}`);
              if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.statusText}`);
              }
              const content = await response.text();
              const donationData = JSON.parse(content);
              return {
                ...donationData,
                fileName: file.fileName
              };
            } catch (error) {
              console.error(`Error fetching content for ${file.fileName}:`, error);
              return null;
            }
          });

          const donationResults = await Promise.all(donationPromises);
          const validDonations = donationResults.filter((d): d is Donation => d !== null);
          
          // Sort by timestamp, newest first
          validDonations.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          setDonations(validDonations);
        }
      } catch (error) {
        console.error('Error fetching donations:', error);
        setError('Failed to load donations');
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col items-center mb-12">
          <Link 
            href="/"
            className="self-start text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
          >
            ← Back to Donate
          </Link>
          <h1 className="text-2xl font-medium text-blue-500">
            Our Donors
          </h1>
        </header>

        <main className="max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-300">Loading donations...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-300">No donations yet. Be the first to donate!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {donations.map((donation, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {donation.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(donation.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {donation.donor.slice(0, 6)}...{donation.donor.slice(-4)}
                    </p>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {donation.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 