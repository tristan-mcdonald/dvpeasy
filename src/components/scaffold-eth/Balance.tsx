import { useEffect, useState } from 'react';
import { formatEther } from 'viem';
import { useBalance } from 'wagmi';
import { Loader2 } from 'lucide-react';

const Balance = ({ address, token }: { address: string; token?: `0x${string}` }) => {
  const { data: balance, isLoading } = useBalance({
    address: address as `0x${string}`,
    token,
  });

  const [displayBalance, setDisplayBalance] = useState('');

  useEffect(() => {
    if (balance) {
      setDisplayBalance(parseFloat(formatEther(balance.value)).toFixed(4));
    }
  }, [balance]);

  if (isLoading) {
    return <Loader2 className="size-4 animate-spin" />;
  }

  return (
    <span className="font-mono whitespace-nowrap border-l border-input-border pl-3">{displayBalance} {balance?.symbol}</span>
  );
};

export default Balance;
