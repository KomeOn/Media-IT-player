$(document).ready(() => {
  let peerConnection = new RTCPeerConnection();
  let remoteConnection = new RTCPeerConnection();
  let iceCandidates = [];
  let answerIceCandidates = [];
  let dataChannel = null;

  $('#Share-Media-Bar').on('click', '#Share-Media', () => {
    console.log("Share Media clicked");
    generateInviteFile();
  });

  $('#Share-Media-Bar').on('change', '#Connect-To', (e) => {
    console.log("Connect To clicked");
    receiveInviteFile(e.target.files);
  })

  $('#Share-Media-Bar').on('click', '#Close-Connection', () => {
    console.log("Close Connection clicked");
    closeAll();
  })

  // Recieve Negotiation
  async function receiveInviteFile(file) {
    console.log(file[0]);
    // console.log(file[0]);
    const reader = new FileReader();
    reader.readAsText(file[0]);
    reader.onload = async (e) => {
      console.log("File reading started", e.target);
      console.log("File reading started", e.target['result']);
      const inviteData = JSON.parse(e.target['result']);
      console.log("File reading started", inviteData["session"]["type"]);
      if (inviteData["session"]["type"] == "offer") {
        console.log("Offer received");
        // Set up ICE candidate collection for answer
        remoteConnection.onicecandidate = (event) => {
          if (event.candidate) {
            answerIceCandidates.push(event.candidate);
          }
        };

        await remoteConnection.setRemoteDescription(inviteData.session);
        // Add received ICE candidates from offer
        if (inviteData.iceCandidates && Array.isArray(inviteData.iceCandidates)) {
          console.log("Adding ICE candidates from offer");
          for (const candidate of inviteData.iceCandidates) {
            try {
              await remoteConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn("Error adding ICE candidate:", e);
            }
          }
        }
        const answer = await remoteConnection.createAnswer();
        await remoteConnection.setLocalDescription(answer);
        console.log("Answer generated:", answer);
        const answerData = {
          session: answer,
          iceCandidates: answerIceCandidates.length ? answerIceCandidates : "No ICE candidates collected",
          metadata: {
            sessionId: crypto.randomUUID(), // Generate a unique session ID
            creator: "UserB",
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Expires in 30 minutes
          },
        };

        // Create and download the invite file
        const blob = new Blob([JSON.stringify(answerData, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "webrtc-answer.json";
        link.click();

        // Clean up the URL object after download
        URL.revokeObjectURL(link.href);
      }
      else {
        console.log("Answer received");
        // Set remote description (answer)
        await peerConnection.setRemoteDescription(inviteData.session);

        // Add received ICE candidates from answer
        if (inviteData.iceCandidates && Array.isArray(inviteData.iceCandidates)) {
          console.log("Adding ICE candidates from answer");
          for (const candidate of inviteData.iceCandidates) {
            try {
              await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn("Error adding ICE candidate:", e);
            }
          }
        }
      }
    }


  }

  // Offer Negotiation
  // Generate SDP and gather ICE
  async function generateOfferAndICE() {
    try {
    // Set up ICE candidate handling
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        iceCandidates.push(event.candidate);
      }
    };
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Wait for ICE gathering to complete
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          peerConnection.removeEventListener("icegatheringstatechange", checkState);
          resolve(); // Resolve anyway after timeout
        }, 5000); // 5 second timeout
        const checkState = () => {
          if (peerConnection.iceGatheringState === "complete") {
            peerConnection.removeEventListener("icegatheringstatechange", checkState);
            resolve();
          } else if (peerConnection.iceConnectionState === "failed") {
            reject(new Error("ICE gathering failed."));
          }
        };
        peerConnection.addEventListener("icegatheringstatechange", checkState);
           // Check immediately in case it's already complete
      checkState();
      });

      return {
        sdp: peerConnection.localDescription.sdp,
        type: peerConnection.localDescription.type,

      };
    } catch (error) {
      console.error("Error during offer and ICE generation:", error);
      throw error; // Propagate the error to be handled by the caller
    }
  }

  // Generate invite file containing SDP, ICE and other metadata
  async function generateInviteFile() {
    console.log("Generating invite...");
    try {
      const offer = await generateOfferAndICE();
      // const offer = peerConnection.createOffer();
      // await peerConnection.setLocalDescription(offer);
      let temp_offer = peerConnection.localDescription.sdp;
      // temp_offer += `m=application 9 DTLS/SCTP webrtc-datachannel\r\n`;
      // temp_offer += `m=video 9 RTP/SAVPF 100\r\n`;
      // temp_offer += `m=audio 9 RTP/SAVPF 111\r\n`;
      const session = {
        type: peerConnection.localDescription.type,
        sdp: temp_offer,
      };
      if (!offer) {
        throw new Error("Failed to generate SDP offer.");
      }

      const inviteData = {
        session: session,
        iceCandidates: iceCandidates.length ? iceCandidates : "No ICE candidates collected",
        metadata: {
          sessionId: crypto.randomUUID(), // Generate a unique session ID
          creator: "UserA",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Expires in 30 minutes
        },
      };

      console.log("Generated Invite Data:", inviteData);

      // Create and download the invite file
      const blob = new Blob([JSON.stringify(inviteData, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "webrtc-invite.json";
      link.click();

      // Clean up the URL object after download
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error("Error generating invite file:", error);

      // Optional: Provide user feedback in the UI
      alert("Failed to generate invite file. Please try again.");
    }
  }

  // State handler
  peerConnection.onsignalingstatechange = async (e) => {
    console.log("Signaling state changed:", peerConnection.signalingState);
    switch (peerConnection.signalingState) {
      case "have-local-offer":
        console.log("Local offer generated");
        break;
      case "have-remote-offer":
        console.log("Remote offer received");
        break;
      case "stable":
        console.log("Connection established");
        if (!dataChannel){
          dataChannel = peerConnection.createDataChannel("chat");
          establishDataChannel(dataChannel);
        }
        break;
    }
  }

  peerConnection.onnegotiationneeded = async (e) => {
    console.log("Negotiation needed");
    try {
      generateInviteFile();
    } catch (error) {
      console.error("Error during offer generation:", error);
    }
  }

  remoteConnection.onsignalingstatechange = async (e) => {
    console.log("Remote signaling state changed:", remoteConnection.signalingState);
    switch (remoteConnection.signalingState) {
      case "have-local-offer":
        console.log("Local offer generated");
        break;
      case "have-remote-offer":
        console.log("Remote offer received");
        break;
      case "stable":
        console.log("Connection established");
        break;
    }
  }

  remoteConnection.ondatachannel = async (e) => {
    console.log("Data channel received");
    const dataChannel = e.channel;
    dataChannel.onmessage = (e) => {
      console.log("Message received:", e.data);
    }
  }

  // Create datachannel
  async function establishDataChannel(dataChannel) {
    console.log("Establishing data channel");
    dataChannel.onopen = () => {
      console.log("Data channel opened");
    }
    dataChannel.onmessage = (e) => {
      console.log("Message received:", e.data);
    }
    dataChannel.onclose = () => {
      console.log("Data channel closed");
    }
    dataChannel.onerror = (e) => {
      console.log("Data channel error:", e);
    }
  }

  // Close Connections
  function closeAll() {
    peerConnection.close();
    remoteConnection.close();
    peerConnection = new RTCPeerConnection();
    remoteConnection = new RTCPeerConnection();
    iceCandidates = [];
    answerIceCandidates = [];
  }
})