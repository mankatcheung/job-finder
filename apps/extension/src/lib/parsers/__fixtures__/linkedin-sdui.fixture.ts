/**
 * Trimmed excerpt of LinkedIn's job-details markup as rendered by their
 * "SDUI" (server-driven UI) system, captured from a real
 * /jobs/search-results/?currentJobId=... page. All classnames are opaque
 * per-build hashes (e.g. `_4bbf76d5`) — real ones, kept as-is, precisely
 * because they're what parseLinkedIn() must NOT depend on. Only the
 * id/href/data-testid structure that the parser actually reads is
 * preserved; unrelated chrome (follow button, insights charts, "about the
 * company" section, etc.) is stripped.
 */
export const linkedInSduiFixture = `
<div class="_4bbf76d5 _10ad090b _552aed37" data-testid="lazy-column" data-component-type="LazyColumn">
  <div class="_4bbf76d5 _552aed37">
    <p class="_18f99264 d836b1ef">
      <a class="df709709 _9f188749" href="https://www.linkedin.com/jobs/view/4444415532/?trackingId=abc">Full Stack Engineer</a>
    </p>
    <a class="_38fbdb66 _66191723" href="https://www.linkedin.com/company/monumentbank/life/">
      <p class="_18f99264"><a class="_3ddc3e36 _763ac08c" href="https://www.linkedin.com/company/monumentbank/life/">Monument</a></p>
    </a>
  </div>
  <div id="JobDetails_AboutTheJob_4444415532" data-sdui-component="com.linkedin.sdui.generated.jobseeker.dsl.impl.aboutTheJob">
    <h2 class="_18f99264 _179f4293">About the job</h2>
    <p class="_18f99264 _5809fef9">
      <span class="b23a9b01" data-testid="expandable-text-box">
        <strong>Full Stack Engineer<br></strong>
        London (Oxford Circus) | Hybrid: 2 days per week<br><br>
        <strong>About Monument</strong><br>
        We're building something genuinely rare: a financial brand for the mass affluent.
      </span>
    </p>
  </div>
  <div id="JobDetails_AboutTheCompany_4444415532" data-sdui-component="com.linkedin.sdui.generated.jobseeker.dsl.impl.aboutTheCompanyForJobDetails">
    <a href="https://www.linkedin.com/company/monumentbank/life/"><p>Monument</p></a>
  </div>
</div>
`;
