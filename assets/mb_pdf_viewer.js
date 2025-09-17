var viewerConfig = {
  embedMode: "LIGHT_BOX",
  showDownloadPDF: false, 
  showPrintPDF: false
};

document.addEventListener("adobe_dc_view_sdk.ready", function () {
  document.getElementById("open-pdf");
});

function previewFile() {
  var adobeDCView = new AdobeDC.View({
    clientId: "f55ae6ea6e7d4f89816f7f36acd6c229"
  });
  
  adobeDCView.previewFile({
    content: {
      location: {
        url: "https://cdn.shopify.com/s/files/1/0536/2624/1223/files/MB_BrandStandards_B2B.pdf",
      },
    },
    metaData: {
      fileName: "MB_BrandStandards_B2B.pdf"
    }
  }, viewerConfig);
};

document.getElementById('open-pdf').addEventListener('click', function () {
  previewFile();
});


document.querySelectorAll('.btn-download-asset').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const href = btn.getAttribute('data-href');
    const newWindow = window.open(href, '_blank');
    if (newWindow) {
      newWindow.location.href = href;
    }
  });
});