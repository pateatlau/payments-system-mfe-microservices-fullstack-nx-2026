/**
 * MFA Settings Component
 *
 * Allows users to enable, configure, and disable Multi-Factor Authentication.
 * Displays QR code for authenticator app setup and manages backup codes.
 *
 * @component
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
  Alert,
  AlertDescription,
} from '@mfe/shared-design-system';
import {
  useMfaStatus,
  useSetupMfa,
  useVerifyMfaSetup,
  useDisableMfa,
  useRegenerateBackupCodes,
} from '../hooks/useMfa';

// Validation schemas
const verifyCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d+$/, 'Code must contain only numbers'),
});

const disableMfaSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  totpCode: z
    .string()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d+$/, 'Code must contain only numbers'),
});

const regenerateCodesSchema = z.object({
  totpCode: z
    .string()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d+$/, 'Code must contain only numbers'),
});

type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;
type DisableMfaFormData = z.infer<typeof disableMfaSchema>;
type RegenerateCodesFormData = z.infer<typeof regenerateCodesSchema>;

// UI States
type MfaUiState =
  | 'status' // Show current status
  | 'setup' // Setting up MFA (showing QR code)
  | 'disable' // Disabling MFA (confirmation form)
  | 'regenerate'; // Regenerating backup codes

export function MfaSettings() {
  const [uiState, setUiState] = useState<MfaUiState>('status');
  const [setupData, setSetupData] = useState<{
    qrCodeDataUrl: string;
    secret: string;
    backupCodes: string[];
  } | null>(null);
  const [newBackupCodes, setNewBackupCodes] = useState<string[] | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Queries and mutations
  const { data: mfaStatus, isLoading: statusLoading, error: statusError } = useMfaStatus();
  const setupMutation = useSetupMfa();
  const verifyMutation = useVerifyMfaSetup();
  const disableMutation = useDisableMfa();
  const regenerateMutation = useRegenerateBackupCodes();

  // Forms
  const verifyForm = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: '' },
  });

  const disableForm = useForm<DisableMfaFormData>({
    resolver: zodResolver(disableMfaSchema),
    defaultValues: { password: '', totpCode: '' },
  });

  const regenerateForm = useForm<RegenerateCodesFormData>({
    resolver: zodResolver(regenerateCodesSchema),
    defaultValues: { totpCode: '' },
  });

  // Handlers
  const handleStartSetup = async () => {
    try {
      setSuccessMessage(null);
      const data = await setupMutation.mutateAsync();
      setSetupData({
        qrCodeDataUrl: data.qrCodeDataUrl,
        secret: data.secret,
        backupCodes: data.backupCodes,
      });
      setUiState('setup');
    } catch {
      // Error handled by mutation
    }
  };

  const handleVerifySetup = async (data: VerifyCodeFormData) => {
    try {
      await verifyMutation.mutateAsync(data.code);
      setSuccessMessage('MFA has been enabled successfully!');
      setUiState('status');
      setSetupData(null);
      verifyForm.reset();
    } catch {
      // Error handled by mutation
    }
  };

  const handleDisableMfa = async (data: DisableMfaFormData) => {
    try {
      await disableMutation.mutateAsync({
        password: data.password,
        totpCode: data.totpCode,
      });
      setSuccessMessage('MFA has been disabled.');
      setUiState('status');
      disableForm.reset();
    } catch {
      // Error handled by mutation
    }
  };

  const handleRegenerateBackupCodes = async (data: RegenerateCodesFormData) => {
    try {
      const result = await regenerateMutation.mutateAsync(data.totpCode);
      setNewBackupCodes(result.backupCodes);
      setSuccessMessage('New backup codes generated!');
      regenerateForm.reset();
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancelSetup = () => {
    setUiState('status');
    setSetupData(null);
    verifyForm.reset();
  };

  const handleCancelDisable = () => {
    setUiState('status');
    disableForm.reset();
  };

  const handleCancelRegenerate = () => {
    setUiState('status');
    setNewBackupCodes(null);
    regenerateForm.reset();
  };

  // Loading state
  if (statusLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading security settings...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (statusError) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load MFA status. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // MFA Setup UI
  if (uiState === 'setup' && setupData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Set Up Two-Factor Authentication</CardTitle>
          <CardDescription>
            Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="flex flex-col items-center space-y-4">
            <img
              src={setupData.qrCodeDataUrl}
              alt="MFA QR Code"
              className="w-48 h-48 border rounded-lg"
            />
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Can't scan? Enter this code manually:
              </p>
              <code className="bg-muted px-3 py-1 rounded text-sm font-mono break-all">
                {setupData.secret}
              </code>
            </div>
          </div>

          {/* Backup Codes */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Save Your Backup Codes</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Store these codes somewhere safe. You can use them to access your account if you lose your authenticator.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {setupData.backupCodes.map((code, index) => (
                <code
                  key={index}
                  className="bg-background px-2 py-1 rounded text-sm font-mono text-center"
                >
                  {code}
                </code>
              ))}
            </div>
          </div>

          {/* Verification Form */}
          <form onSubmit={verifyForm.handleSubmit(handleVerifySetup)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verify-code">Enter the 6-digit code from your authenticator app</Label>
              <Input
                id="verify-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
                {...verifyForm.register('code')}
                disabled={verifyMutation.isPending}
              />
              {verifyForm.formState.errors.code && (
                <p className="text-sm text-destructive">
                  {verifyForm.formState.errors.code.message}
                </p>
              )}
            </div>

            {verifyMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {verifyMutation.error instanceof Error
                    ? verifyMutation.error.message
                    : 'Verification failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={verifyMutation.isPending}
                className="flex-1"
              >
                {verifyMutation.isPending ? 'Verifying...' : 'Verify & Enable MFA'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelSetup}
                disabled={verifyMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Disable MFA UI
  if (uiState === 'disable') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Disable Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter your password and current authenticator code to disable MFA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={disableForm.handleSubmit(handleDisableMfa)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">Password</Label>
              <Input
                id="disable-password"
                type="password"
                placeholder="Enter your password"
                {...disableForm.register('password')}
                disabled={disableMutation.isPending}
              />
              {disableForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {disableForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="disable-totp">Authenticator Code</Label>
              <Input
                id="disable-totp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="text-center text-xl tracking-widest"
                {...disableForm.register('totpCode')}
                disabled={disableMutation.isPending}
              />
              {disableForm.formState.errors.totpCode && (
                <p className="text-sm text-destructive">
                  {disableForm.formState.errors.totpCode.message}
                </p>
              )}
            </div>

            {disableMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {disableMutation.error instanceof Error
                    ? disableMutation.error.message
                    : 'Failed to disable MFA. Please check your credentials.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                variant="destructive"
                disabled={disableMutation.isPending}
                className="flex-1"
              >
                {disableMutation.isPending ? 'Disabling...' : 'Disable MFA'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelDisable}
                disabled={disableMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Regenerate Backup Codes UI
  if (uiState === 'regenerate') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Regenerate Backup Codes</CardTitle>
          <CardDescription>
            This will invalidate your existing backup codes and generate new ones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {newBackupCodes ? (
            <>
              <Alert>
                <AlertDescription>
                  Save these new backup codes somewhere safe. Your old codes no longer work.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-2">
                {newBackupCodes.map((code, index) => (
                  <code
                    key={index}
                    className="bg-muted px-2 py-1 rounded text-sm font-mono text-center"
                  >
                    {code}
                  </code>
                ))}
              </div>
              <Button onClick={handleCancelRegenerate} className="w-full">
                Done
              </Button>
            </>
          ) : (
            <form onSubmit={regenerateForm.handleSubmit(handleRegenerateBackupCodes)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="regenerate-totp">Enter your current authenticator code</Label>
                <Input
                  id="regenerate-totp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center text-xl tracking-widest"
                  {...regenerateForm.register('totpCode')}
                  disabled={regenerateMutation.isPending}
                />
                {regenerateForm.formState.errors.totpCode && (
                  <p className="text-sm text-destructive">
                    {regenerateForm.formState.errors.totpCode.message}
                  </p>
                )}
              </div>

              {regenerateMutation.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {regenerateMutation.error instanceof Error
                      ? regenerateMutation.error.message
                      : 'Failed to regenerate codes. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={regenerateMutation.isPending}
                  className="flex-1"
                >
                  {regenerateMutation.isPending ? 'Generating...' : 'Generate New Codes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelRegenerate}
                  disabled={regenerateMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default: Status view
  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account by requiring a code from your authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {successMessage && (
          <Alert>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {setupMutation.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {setupMutation.error instanceof Error
                ? setupMutation.error.message
                : 'Failed to start MFA setup. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Status display */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">Status</h4>
            <p className="text-sm text-muted-foreground">
              {mfaStatus?.enabled && mfaStatus?.verified
                ? 'Two-factor authentication is enabled'
                : 'Two-factor authentication is not enabled'}
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              mfaStatus?.enabled && mfaStatus?.verified
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}
          >
            {mfaStatus?.enabled && mfaStatus?.verified ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {/* Actions based on MFA status */}
        {mfaStatus?.enabled && mfaStatus?.verified ? (
          <div className="space-y-4">
            {/* Backup codes info */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Backup Codes</h4>
                <p className="text-sm text-muted-foreground">
                  {mfaStatus.backupCodesRemaining} of 10 codes remaining
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUiState('regenerate')}
              >
                Regenerate
              </Button>
            </div>

            {/* Disable button */}
            <Button
              variant="destructive"
              onClick={() => setUiState('disable')}
              className="w-full"
            >
              Disable Two-Factor Authentication
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Protect your account with two-factor authentication. You'll need an authenticator app like Google Authenticator or Authy.
            </p>
            <Button
              onClick={handleStartSetup}
              disabled={setupMutation.isPending}
              className="w-full"
            >
              {setupMutation.isPending ? 'Setting up...' : 'Enable Two-Factor Authentication'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MfaSettings;
