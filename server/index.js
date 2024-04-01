const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const secp = require('ethereum-cryptography/secp256k1');
const {keccak256} = require('ethereum-cryptography/keccak');

app.use(cors());
app.use(express.json());

// private keys
//// private key: 1e414bba3a383980fb961b5b6b481d860e474dd8f0de1d1e524b42c4bef381e2
//// private key: d21eeeabb8321f6b8afd7ecfca144418845f92c2f16f38ba79bf438543fea3a0
//// private key: 578b6e342a423b6e767ba6b5936ba6895c13d8e16d7925ad2bc8b64961e6c9ef

// public keys
const balances = {
  "0245c46d4b854e5bfcd1fb27973a840044ecd070499cb3d95a1443abdf6e50cf53": 100,
  "03c6f969754955c5ce4eaaed2479294aee6d22f19291e7a1acc8c69229bf298421": 50,
  "03fb2d2cc876292f198dc28147a782a753cc4ddee3e102e9633ccc3554054a0a22": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, sig:sigStringed, msg } = req.body;
  const { recipient, amount } = msg;

  // convert stringified bigints back to bigints
  const sig = {
    ...sigStringed,
    r: BigInt(sigStringed.r),
    s: BigInt(sigStringed.s)
  }

  const hashMessage = (message) => keccak256(Uint8Array.from(message));

  const isValid = secp.secp256k1.verify(sig, hashMessage(msg), sender) === true;
  
  if(!isValid) res.status(400).send({ message: "Bad signature!"});

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}