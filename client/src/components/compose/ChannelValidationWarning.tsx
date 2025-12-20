import type { ChannelValidation } from "./types";

interface ChannelValidationWarningProps {
  validation: ChannelValidation;
  selectedCount: number;
}

export default function ChannelValidationWarning({ 
  validation, 
  selectedCount 
}: ChannelValidationWarningProps) {
  if (selectedCount === 0 || !validation.hasWarnings) return null;

  return (
    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md space-y-2" data-testid="channel-validation-warning">
      <div className="flex items-start gap-2">
        <div className="text-yellow-500 mt-0.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 text-sm">
          <p className="font-medium text-yellow-600 dark:text-yellow-500">Some contacts missing data</p>
          <div className="text-xs text-muted-foreground mt-1 space-y-1">
            {validation.includesEmail && validation.skippedEmail.length > 0 && (
              <p>
                <span className="font-medium">{validation.skippedEmail.length}</span> contact{validation.skippedEmail.length !== 1 ? 's' : ''} missing email
              </p>
            )}
            {validation.includesSms && validation.skippedSms.length > 0 && (
              <p>
                <span className="font-medium">{validation.skippedSms.length}</span> contact{validation.skippedSms.length !== 1 ? 's' : ''} missing phone
              </p>
            )}
            {validation.includesLinkedin && validation.skippedLinkedin.length > 0 && (
              <p>
                <span className="font-medium">{validation.skippedLinkedin.length}</span> contact{validation.skippedLinkedin.length !== 1 ? 's' : ''} missing LinkedIn URL
              </p>
            )}
            {(validation.includesEmail || validation.includesSms || validation.includesLinkedin) && (
              <p className="mt-1 text-green-600 dark:text-green-500">
                Will send: {validation.includesEmail && `${validation.emailSends} email${validation.emailSends !== 1 ? 's' : ''}`}
                {validation.includesEmail && validation.includesSms && ', '}
                {validation.includesSms && `${validation.smsSends} SMS`}
                {(validation.includesEmail || validation.includesSms) && validation.includesLinkedin && ', '}
                {validation.includesLinkedin && `${validation.linkedinSends} LinkedIn`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
