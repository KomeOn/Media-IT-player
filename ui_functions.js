import { handleAudioFile, receiveInviteFile } from "./webrtc_functions.js";

$(document).ready(() => {
  console.log("Document ready"); // Add this to verify the script loads
  // Code to manipulate UI
  var d = new Date();
  var n = d.getFullYear();
  $("#Yrs").text(n);
  $('#Share-Media-Bar').hide();
  $('#Video-Play').hide();
  $('#Audio-Play').hide();
  $('#Pic-Play').hide();

  function readURL(input) {
    console.log(input);
    console.log(input.files);
    const file = input.files[0];
    if (file && file.type == "application/json") {
      console.log("invite found");
      receiveInviteFile(input.files);
      videoState(1);
    }
    else if (file && file.type.startsWith("video/")) {
      console.log("video");
      // var reader = new FileReader();
      const fileBlob = URL.createObjectURL(file);
      $('#Video-Play').attr('src', fileBlob);
      $('#Video-Play').on('load', () => {
        URL.revokeObjectURL(fileBlob);
      });
      videoState(1);
    }
    else if (file && file.type.startsWith("image/")) { 
      const fileBlob = URL.createObjectURL(file);
      console.log("Image", fileBlob);
      $('#Pic-Play')
            .attr('src', fileBlob)
            .on('load', function() {
                URL.revokeObjectURL(fileBlob);
            })
            .on('error', function() {
              console.error('Error loading image');
              URL.revokeObjectURL(fileBlob);
              $(this).attr('src', ''); // Clear the source on error
          });
      videoState(2);
    }
    else if (file && file.type.startsWith("audio/")) { 
      const fileBlob = URL.createObjectURL(file);
      console.log("Audio", fileBlob);
      $('#Audio-Play').attr('src', fileBlob);
      $('#Audio-Play').on('load', () => {
        URL.revokeObjectURL(fileBlob);
      });
      videoState(3);
    }
    else {
      videoState(4);
    }

  }
  $("#Media-Input").on("change", function(e) {
    try {
      console.log("File input change detected");
      readURL(this);
    } catch(e) {
      console.error("Error in change handler:", e);
    }
  });
  function videoState(typ) {
    if (typ == 4) {
      $('#Instruct-Placeholder').show();
      $('.playable').attr('src', '');
      $('.playable').hide();
      $('#Share-Media-Bar').hide();
    }
    else if (typ == 3) {
      $('#Instruct-Placeholder').hide();
      $('.playable').hide();
      $('#Audio-Play').show();
      $('#Share-Media-Bar').show();    
      $('#Connect-To').hide();
      $('#Close-Connection').hide();
    }
    else if (typ == 2) {
      $('#Instruct-Placeholder').hide();
      $('.playable').hide();
      $('#Pic-Play').show();
      $('#Share-Media-Bar').show();
      $('#Connect-To').hide();
      $('#Close-Connection').hide();
    }
    else if (typ == 1) {
      $('#Instruct-Placeholder').hide();
      $('.playable').hide();
      // $('#Video-Play').show();
      // $('#Share-Media-Bar').show();
      // $('#Connect-To').hide();
      $('#Close-Connection').hide();
    }
  }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // let peerConnection = new RTCPeerConnection();
  // let remoteConnection = new RTCPeerConnection();
  // let iceCandidates = [];
  // let answerIceCandidates = [];
  // let dataChannel = peerConnection.createDataChannel("chat");

  // $('#Share-Media-Bar').on('click', '#Share-Media', () => {
  //   console.log("Share Media clicked");
  //   generateInviteFile();
  // });

  // $('#Share-Media-Bar').on('click', '#Connect-To', () => {
  //   console.log("Connect To clicked");
  // })

  // $('#Share-Media-Bar').on('click', '#Close-Connection', () => {
  //   console.log("Close Connection clicked");
  // })

  // async function generateOfferAndICE() {
  //   try {
  //     const offer = await peerConnection.createOffer();
  //     await peerConnection.setLocalDescription(offer);
  
  //     // Wait for ICE gathering to complete
  //     await new Promise((resolve, reject) => {
  //       const checkState = () => {
  //         if (peerConnection.iceGatheringState === "complete") {
  //           peerConnection.removeEventListener("icegatheringstatechange", checkState);
  //           resolve();
  //         } else if (peerConnection.iceConnectionState === "failed") {
  //           reject(new Error("ICE gathering failed."));
  //         }
  //       };
  //       peerConnection.addEventListener("icegatheringstatechange", checkState);
  //     });
  
  //     return {
  //       sdp: peerConnection.localDescription.sdp,
  //       type: peerConnection.localDescription.type,
  //     };
  //   } catch (error) {
  //     console.error("Error during offer and ICE generation:", error);
  //     throw error; // Propagate the error to be handled by the caller
  //   }
  // }
  

  // async function generateInviteFile() {
  //   console.log("Generating invite...");
  //   try {
  //     const offer = await generateOfferAndICE();
  //     if (!offer) {
  //       throw new Error("Failed to generate SDP offer.");
  //     }
  
  //     const inviteData = {
  //       session: offer,
  //       iceCandidates: iceCandidates.length ? iceCandidates : "No ICE candidates collected",
  //       metadata: {
  //         sessionId: crypto.randomUUID(), // Generate a unique session ID
  //         creator: "UserA",
  //         createdAt: new Date().toISOString(),
  //         expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Expires in 30 minutes
  //       },
  //     };
  
  //     console.log("Generated Invite Data:", inviteData);
  
  //     // Create and download the invite file
  //     const blob = new Blob([JSON.stringify(inviteData, null, 2)], { type: "application/json" });
  //     const link = document.createElement("a");
  //     link.href = URL.createObjectURL(blob);
  //     link.download = "webrtc-invite.json";
  //     link.click();
  
  //     // Clean up the URL object after download
  //     URL.revokeObjectURL(link.href);
  
  //   } catch (error) {
  //     console.error("Error generating invite file:", error);
  
  //     // Optional: Provide user feedback in the UI
  //     alert("Failed to generate invite file. Please try again.");
  //   }
  // }
  

});