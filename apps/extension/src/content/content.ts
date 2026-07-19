import { parseJobPage } from '../lib/parsers/index';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_JOB_DATA') {
    const jobData = parseJobPage();
    sendResponse({ jobData });
  }
  return true; // keep message channel open for async sendResponse
});
