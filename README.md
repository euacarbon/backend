The Sustain Showcase xApp Frontend
=

![Xrp](https://img.shields.io/badge/Xrp-black?style=for-the-badge&logo=xrp&logoColor=white)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)

This application exists to support [Sustain Ventures](https://sustain.ventures)'s exploration of the carbon token space.

This README is for the backend component. You should also read the [front-end code](https://github.com/euacarbon/xapp).


Copyright
--

With the exception of brand elements, this code is available under [Creative Commons ATTRIBUTION 4.0 INTERNATIONAL](https://creativecommons.org/licenses/by/4.0/legalcode.en) license.


Intended Audience
--

If you've found this, most likely you are also looking at XRP networks (perhaps even [Xanhau](https://xahau.network/)) and carbon tokens. Hello friend, do go to our website and get in touch.


Overview
--

We use this app as a general as a general talking point, and for occasional demonstrations to show that we can handle moving, buying, sell etc a token with in [Xaman](https://xaman.app/).

It's unashamedly, not very unique, but we've found it useful as we explore our future requirements for a tokenisation route.
Also, it's a bit neglected as we've realised that current market is B2B orientated, so digital custody systems, like
[Fireblocks](https://www.fireblocks.com/), are more likely to be our focus. Nevertheless, it is hard to see how any complex
asset will trade without a "control panel" so this serves as our placeholder for that too.

Our journey, including this code has been generously supported by the [XRP Foundation](https://xrpl.org/) 🙏 The credit is
theirs, the mistakes are ours!


Prerequisites
--

This is a very normal nodejs backend. A few things you should familiarise yourself with before you start.

* [Xumm (now Xaman) Universal SDK](https://github.com/XRPL-Labs/Xumm-Universal-SDK)
* [XRPL Client Library](https://github.com/XRPLF/xrpl.js#readme)
* [Xaman Payloads](https://docs.xaman.dev/concepts/payloads-sign-requests) which we create here for easier changes.

We run on testnet as we don't want to deploy on unbacked token live, but that's not a requirement.

Use Cases
--

* Create a trust line for the Sustain token or `SUS`.
* Buy `SUS`
* Sell `SUS`
* Retire it for an NFT documenting the amount burned.


Structure
--

There is no storage outside of the XRP ledger. The server is stateless itself.

It follows the standard Express app layout with the following self-explainatory HTTP routes

* `/getXRPBalance`
* `/send`
* `/issueToken`
* `/createTrustLine`
* `/getTokenBalance`
* `/sendToken`
* `/tradeToken`
* `/getAvailableSwapPath`


Caveats
--

Obviously this is not a complete carbon token trading environment. We have a lot of business related things to nail down
before we build that. (And we might not put all of it Github 🙂)

If you are working from this here's a few things to bear in mind:
* We do a lot of things on the server-side that could be in the [front end](https://github.com/euacarbon/xapp). That's not as Web3 as it could be...
* The NFT logic should really be in [hooks](https://hooks.xrpl.org/) to guarantee the behaviour. However they are not available on the mainnet. We [are watching](https://github.com/XRPLF/rippled/tree/hooks)... Also, you have to learn C.
* [Xanhau](https://xahau.network/) might be better bet...
* Going live on Xaman requires a code audit. Not to mention the AppStore-style requirements. Probably best to be in sandbox mode if you are just demo-ing.


Open Questions 🤔
--

### KYC

We were very enamoured with Xaman's [built-in KYC](https://help.xaman.app/app/learning-more-about-xaman/kyc).

But there are limitations, such as needing to be a Pro Beta member. How we might access the relevant flags for geo-locking etc tokens using hooks (when hooks are released) is unclear. Most emerging digital asset regulations, like MiCA, include suitability requirements, it is unclear how these could be cleared without custom infrastructure...

The likely solutions look to be in W3C VC inspired solutions at the individual level, or tokens circulating with a "club", for example, a Freetrade Zone, for B2B circulation.


### Pushing the app to users

Some way to safely "staple" this app to the token. Although with the limitations of Trust Lines, this isn't as much a worry as with `ERC20` tokens.


### Nicer NFTs

As a team, we are huge fans of the [Uniswap NFTs](https://docs.uniswap.org/contracts/v3/reference/periphery/libraries/NFTSVG), and have done "questionable" things with `ERC1155` and `tokenUri`. (Possibly something similar can be done with [Xanhau](https://xahau.network/), but we have yet to figure it out.)

Difficult trade off between immutability and attractive visualisation, but probably needs to be server based for the foreseable 😐