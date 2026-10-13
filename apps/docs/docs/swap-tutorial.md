---
sidebar_position: 1
title: Swap Tutorial
---

# Swap Tutorial

Complete guide to your first private swap.

:::info Time
First swap: ~5 min | Subsequent: ~2 min
:::

## Step 1: Connect

1. Go to [nemi.fi](https://nemi.fi)
2. Click **Connect Wallet** (top right)
3. Select MetaMask or WalletConnect
4. Approve connection

## Step 2: Select Tokens

1. Click **From** token selector → Choose input
2. Click **To** token selector → Choose output

Popular pairs: ETH/USDC, ETH/USDT, WBTC/USDC

## Step 3: Enter Amount

- Type amount or use **25% / 50% / 75% / MAX**
- Output calculates automatically
- Check **price impact** (keep under 1%)

## Step 4: Configure (Optional)

Click the gear icon to adjust:

| Setting  | Stable Pairs | Volatile |
| -------- | ------------ | -------- |
| Slippage | 0.5%         | 1%       |

## Step 5: Execute

1. Click **Private Swap**
2. Confirm in wallet
3. Wait for ZK proof (15-30s) — **don't close tab**
4. Transaction confirms

:::tip
Your address stays private. Only pool changes are visible on-chain.
:::

## Troubleshooting

| Issue               | Fix                          |
| ------------------- | ---------------------------- |
| High price impact   | Reduce amount or split trade |
| Transaction failed  | Increase slippage            |
| Proof stuck         | Wait 60s, retry              |
| Balance not updated | Wait 1-3 blocks, refresh     |

## Video

<div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', margin: '2rem 0'}}>
  <iframe
    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
    src="https://www.youtube.com/embed/KqGlQarbn9s"
    title="Nemi Swap Tutorial"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen>
  </iframe>
</div>

## Next Steps

- [Provide Liquidity](./providing-liquidity) — Earn fees
