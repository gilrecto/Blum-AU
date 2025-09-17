function fbqSearchKeyword() {
var locationSearch = window.location.search;
var utmSource = locationSearch.match(/[?&]utm_source=([^&#]*)/);
var utmMedium = locationSearch.match(/[?&]utm_medium=([^&#]*)/);
var utmCampaign = locationSearch.match(/[?&]utm_campaign=([^&#]*)/);
var trackingFields = {
utm_source: utmSource && utmSource[1],
utm_medium: utmMedium && utmMedium[1],
utm_campaign: utmCampaign && utmCampaign[1],
};
if (!utmSource || !utmSource[1]) {
trackingFields.utm_source = 'organic';
}
var referrer = document.referrer;
if (referrer) {
var link = document.createElement('a');
link.setAttribute('href', referrer);
var pattern = new RegExp('[\\?&](?:q|query)=([^&#]*)');
var query = link.search.match(pattern);
if (query && query.length > 0) {
var keyword = query[1].replace(/\+/gi, "%20");
}
if (keyword) {
trackingFields.hostname = link.hostname;
trackingFields.keyword = decodeURIComponent(keyword);
} else {
trackingFields.hostname = link.hostname;
trackingFields.keyword = null;
}
} else {
trackingFields.hostname = null;
trackingFields.keyword = null;
}
  if (document.referrer.indexOf(location.protocol + "//" + location.host) !== 0){
  	fbq('trackCustom', 'referrerSource', trackingFields);
  }

}

setTimeout(fbqSearchKeyword, 5000);