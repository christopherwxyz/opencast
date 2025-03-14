import { SEO } from '@components/common/seo';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { useRouter } from 'next/router';
import { type ReactElement, type ReactNode } from 'react';
import useSWR from 'swr';
import { Error } from '../../../components/ui/error';
import { Loading } from '../../../components/ui/loading';
import { MenuRow } from '../../../components/ui/menu-row';
import { useAuth } from '../../../lib/context/auth-context';
import { formatDate, formatNumber } from '../../../lib/date';
import { fetchJSON } from '../../../lib/fetch';
import { SignersResponse } from '../../../lib/types/signer';
import { truncateAddress } from '../../../lib/utils';
import { CautionWarn } from '../../../components/ui/caution-warn';

export default function ManageSigners(): JSX.Element {
  const { user } = useAuth();

  const { back } = useRouter();

  const { data: signers, isValidating: loading } = useSWR(
    `/api/user/${user?.id}/signers`,
    async (url: string) => (await fetchJSON<SignersResponse>(url)).result,
    {
      revalidateOnFocus: false
    }
  );

  const matchesCurrentSigner = (pubKey: string) => {
    return user?.keyPair?.publicKey.toLowerCase() === pubKey.toLowerCase();
  }

  if (loading) {
    // Render a loading indicator while the data is being fetched
    return <Loading />;
  }

  if (!signers) {
    // Render a message or a placeholder if signers is not yet available
    return <div>Loading signers...</div>;
  }

  let sortedSigners = [];

  const currentSigner = signers.find((s) => matchesCurrentSigner(s.pubKey));
  if (currentSigner) {
    sortedSigners.push(currentSigner);
  }

  sortedSigners = [
    ...sortedSigners,
    ...signers.filter((s) => !matchesCurrentSigner(s.pubKey))
  ];


  return (
    <MainContainer>
      <SEO title={`Manage Signers / Opencast`} />
      <MainHeader
        useMobileSidebar
        title='Manage Signers'
        useActionButton
        action={back}
      ></MainHeader>
            <section>
        {!user?.keyPair ? (
          <div>You're not logged in.</div>
        ) : loading ? (
          <Loading />
        ) : signers ? (
          <div>
            <CautionWarn></CautionWarn>
            {sortedSigners.map((signer) => (
              <div
                key={signer.pubKey}
                title={
                  matchesCurrentSigner(signer.pubKey)
                    ? 'Signer currently used by this app'
                    : undefined
                }
              >
                <MenuRow
                  href={`/settings/manage-signers/${signer.pubKey}`}
                  title={`${signer.name || truncateAddress(`0x${signer.pubKey}`)
                    }`}
                  description={`${formatNumber(
                    signer.messageCount
                  )} messages • Last used ${formatDate(
                    new Date(signer.lastMessageTimestamp),
                    'tweet'
                  )}`}
                  iconName='KeyIcon'
                  variant={
                    matchesCurrentSigner(signer.pubKey)
                      ? 'primary'
                      : undefined
                  }
                ></MenuRow>
              </div>
            ))}
          </div>
        ) : (
          <Error />
        )}
      </section>
    </MainContainer>
  );
}

ManageSigners.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
