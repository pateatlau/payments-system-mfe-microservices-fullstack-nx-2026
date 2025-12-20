import { ComponentType } from 'react';

/**
 * Props for ProfilePage component
 * The ProfilePage from Profile MFE doesn't require any props
 */
export type ProfileComponentProps = Record<string, never>;

/**
 * ProfilePage component wrapper
 * This component wraps the ProfilePage from the Profile MFE
 */
export function ProfilePage({
  ProfileComponent,
}: {
  ProfileComponent: ComponentType<ProfileComponentProps>;
}) {
  return <ProfileComponent />;
}
