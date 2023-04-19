const zapcoEqForm = document.getElementById("zapcoAutoEqForm");

zapcoEqForm.onsubmit = function (event) {
  event.preventDefault();

  const rewFilter = document.getElementById("input-rew-file").files[0];
  const zapcoEqFile = document.getElementById("input-zapco-file").files[0];
  const channel = document.getElementById("channel-selection").value;

  console.log(rewFilter);

  window.electronAPI.submitForm(rewFilter.path, zapcoEqFile.path, channel);
};
