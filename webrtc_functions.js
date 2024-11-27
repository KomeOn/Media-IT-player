// $(document).ready(() => {
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
  export async function receiveInviteFile(file) {
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
    $('#Connect-To').show();
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
        $('#Close-Connection').show();
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
        $('#Close-Connection').show();
        break;
    }
  }

  remoteConnection.ondatachannel = async (e) => {
    console.log("Data channel received");
    const dataChannel = e.channel;
    let receivedChunks = [];
    dataChannel.onmessage = (e) => {
      console.log("Message received:", e.data);
      if (event.data === "End_of_Audio_File") {
        // Combine all received chunks into a Blob
        // const audioBlob = new Blob(receivedChunks, { type: "audio/webm" });
        const audioBlob = new Blob(receivedChunks, { type: "audio/mp3" });
        playReceivedAudio(audioBlob);
        receivedChunks = []; // Reset for the next transmission
        $('#Share-Media-Bar').show();
    } else {
        receivedChunks.push(event.data);
    }
    }
  }

  // Create datachannel
  async function establishDataChannel(dataChannel) {
    console.log("Establishing data channel");
    dataChannel.onopen = () => {
      let src = ""
      console.log("Data channel opened");
      if ($('#Video-Play').attr('src') != undefined){
        src = $('#Video-Play').attr('src');
        console.log("Video received", src);      
      }
      else if ($('#Audio-Play').attr('src') != undefined){
        let src = $('#Audio-Play').attr('src');
        console.log("Audio received", src);
        handleAudioFile(src);
      }
      else if ($('#Pic-Play').attr('src') != undefined){
        src = $('#Pic-Play').attr('src');
        console.log("Picture received", src);
      }}
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

  // send audio files
  async function audioSent(audioURL) {
    const response = await fetch(audioURL);
    const audioBlob = await response.blob();
    console.log("Audio Blob fetched:", audioBlob);
    const audioBuffer = await audioBlob.arrayBuffer();
    const chunkSize = 16384;
    let offset = 0;
    while (offset < audioBuffer.byteLength) {
      const chunk = audioBuffer.slice(offset, offset + chunkSize);
      dataChannel.send(chunk);
      offset += chunkSize;
    }
    dataChannel.send("End_of_Audio_File");
  }

  export async function handleAudioFile(file) {
    // const file = inputElement.files[0];
    // if (file && file.type.startsWith("audio/")) {
    console.log("Sending audio file:", file.name);
    audioSent(file);
    // } else {
    //     console.error("Please select a valid audio file.");
    // }
}

function playReceivedAudio(audioBlob) {
  const audioURL = URL.createObjectURL(audioBlob);
  $('#Audio-Play').attr('src', audioURL);
  $('#Audio-Play').show();
      $('#Audio-Play').on('load', () => {
        URL.revokeObjectURL(audioURL);
      });
  // const audioElement = new Audio(audioURL);
  // audioElement.play().catch((err) => console.error("Audio playback failed:", err));
}

// })