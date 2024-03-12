import {useState, useEffect} from "react";
import {ethers} from "ethers";
import {Row, Form, Button, Card, ListGroup, Col} from "react-bootstrap";
import {create as ipfsHttpClient} from "ipfs-http-client";
const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

const App = ({contract}) => {
  const [profile, setProfile] = useState("");
  const [nfts, setNfts] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const loadMyNFTs = async () => {
    // Get users nft ids
    const results = await contract.getMyNfts();
    // Fetch metadata of each nft and add that to nft object.
    console.log(results);
    let nfts = await Promise.all(
      results.map(async (i) => {
        // get uri url of nft
        const uri = await contract.tokenURI(i);
        // fetch nft metadata
        console.log(uri);
        const response = await fetch(uri);
        const metadata = await response.json();
        return {
          id: i,
          username: metadata.username,
          avatar: metadata.avatar,
        };
      })
    );
    setNfts(nfts);
    getProfile(nfts);
  };
  const getProfile = async (nfts) => {
    const address = await contract.signer.getAddress();
    const id = await contract.profiles(address);
    const profile = nfts.find((i) => i.id.toString() === id.toString());
    console.log(profile);
    setProfile(profile);
    setLoading(false);
  };
  const uploadToIPFS = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (typeof file !== "undefined") {
      try {
        const formData = new FormData();
        formData.append("file", file, {filename: "fileToUpload.name"});

        const options = {
          method: "POST",
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI5Nzk5ZTE5Ni1jOTVhLTQ0OWQtODliYS1mNTJhMWQyYmNmNjEiLCJlbWFpbCI6InNpZGRlc2hzYW5raHlhQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJiNzlmYjM4MzE5MDFkNDZlYzg0YyIsInNjb3BlZEtleVNlY3JldCI6ImQ3YmNkNzE4YTA5ZDNlMDQ0NTlmMWY1ZWY4ZTNlZjJhN2JiY2U0NzM1YzYzZTQyMTczY2M4MWQ5MTQ3OTA1MzgiLCJpYXQiOjE3MDk4MTAyNDR9.wYmjqt7talCUzZTaaMf_DkYYWQ5L8AHwhkZ0h2ry19M",
          },
          body: formData,
        };

        const response = await fetch(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          options
        );

        const data = await response.json();
        console.log("data: ", data);
        let hash = data.IpfsHash;
        console.log("hash: ", hash);

        setAvatar(hash);
      } catch (error) {
        console.log("ipfs image upload error: ", error);
      }
    }
  };
  const mintProfile = async (event) => {
    if (!avatar || !username) return;
    try {
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
          "Content-Type": "application/json",
        },
        body: `{"pinataContent":{"avatar":"${avatar}", "username":"${username}"}}`,
      };

      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        options
      );
      const data = await response.json();
      setLoading(true);
      if (data.IpfsHash === undefined) {
        console.log(data);
        return;
      }
      await (
        await contract.mint(`https://ipfs.io/ipfs/${data.IpfsHash}`)
      ).wait();
      loadMyNFTs();
    } catch (error) {
      window.alert("ipfs uri upload error: ", error);
    }
  };
  const switchProfile = async (nft) => {
    setLoading(true);
    await (await contract.setProfile(nft.id)).wait();
    getProfile(nfts);
  };
  useEffect(() => {
    if (!nfts) {
      loadMyNFTs();
    }
  });
  if (loading)
    return (
      <div className="text-center">
        <main style={{padding: "1rem 0"}}>
          <h2>Loading...</h2>
        </main>
      </div>
    );
  return (
    <div className="mt-4 text-center">
      {profile ? (
        <div className="mb-3">
          <h3 className="mb-3">{profile.username}</h3>
          <img
            className="mb-3"
            style={{width: "400px"}}
            src={`https://ipfs.io/ipfs/${profile.avatar}`}
          />
        </div>
      ) : (
        <h4 className="mb-4">No NFT profile, please create one...</h4>
      )}

      <div className="row">
        <main
          role="main"
          className="col-lg-12 mx-auto"
          style={{maxWidth: "1000px"}}
        >
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
              />
              <Form.Control
                onChange={(e) => setUsername(e.target.value)}
                size="lg"
                required
                type="text"
                placeholder="Username"
              />
              <div className="d-grid px-0">
                <Button onClick={mintProfile} variant="primary" size="lg">
                  Mint NFT Profile
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
      <div className="px-5 container">
        <Row xs={1} md={2} lg={4} className="g-4 py-5">
          {nfts.map((nft, idx) => {
            if (nft.id === profile.id) return;
            return (
              <Col key={idx} className="overflow-hidden">
                <Card>
                  <Card.Img variant="top" src={nft.avatar} />
                  <Card.Body color="secondary">
                    <Card.Title>{nft.username}</Card.Title>
                  </Card.Body>
                  <Card.Footer>
                    <div className="d-grid">
                      <Button
                        onClick={() => switchProfile(nft)}
                        variant="primary"
                        size="lg"
                      >
                        Set as Profile
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </div>
  );
};

export default App;
