import { cyphras, isExtensionInstalled } from '@cyphras/sdk'
// type-only: wallet.tsx dynamically imports the kit so its bundle stays out of the eager
// chunk; a value import of ModuleType here would pull it back in statically at build time
import type { IOnChangeEvent, ModuleInterface, ModuleType } from '@creit-tech/stellar-wallets-kit'

export const CYPHRAS_ID = 'cyphras'

// Wraps @cyphras/sdk (window.postMessage bridge to the Cyphras browser extension) as a
// stellar-wallets-kit module, so it shows up in the kit's wallet picker alongside Freighter etc.
export class CyphrasModule implements ModuleInterface {
  moduleType = 'HOT_WALLET' as ModuleType // ModuleType.HOT_WALLET's runtime value, see import note above
  productId = CYPHRAS_ID
  productName = 'Cyphras'
  productUrl = 'https://cyphras.com'
  productIcon = 'https://www.cyphras.com/icon.svg'

  async isAvailable(): Promise<boolean> {
    return isExtensionInstalled()
  }

  async getAddress(params?: { skipRequestAccess?: boolean }): Promise<{ address: string }> {
    // skipRequestAccess reads the already-granted account without a popup; otherwise
    // connect() prompts the user to approve this site, matching the kit's own contract
    const res = params?.skipRequestAccess
      ? await cyphras.stellar.getAccount()
      : await cyphras.stellar.connect()
    if (res.error) throw new Error(res.error.message)
    return { address: res.address }
  }

  async signTransaction(xdr: string): Promise<{ signedTxXdr: string; signerAddress?: string }> {
    const res = await cyphras.stellar.sign(xdr)
    if (res.error) throw new Error(res.error.message)
    return { signedTxXdr: res.signedTxXdr, signerAddress: res.signerAddress }
  }

  async signAuthEntry(
    authEntry: string,
    opts?: { networkPassphrase?: string },
  ): Promise<{ signedAuthEntry: string; signerAddress?: string }> {
    const res = await cyphras.stellar.sign(authEntry, {
      type: 'authEntry',
      networkPassphrase: opts?.networkPassphrase,
    })
    if (res.error) throw new Error(res.error.message)
    return { signedAuthEntry: res.signedAuthEntry, signerAddress: res.signerAddress }
  }

  async signMessage(message: string): Promise<{ signedMessage: string; signerAddress?: string }> {
    const res = await cyphras.stellar.sign(message, { type: 'message' })
    if (res.error) throw new Error(res.error.message)
    // the kit calls this field signedMessage; the SDK calls the same base64 value signature
    return { signedMessage: res.signature, signerAddress: res.signerAddress }
  }

  async getNetwork(): Promise<{ network: string; networkPassphrase: string }> {
    const res = await cyphras.stellar.getNetwork()
    if (res.error) throw new Error(res.error.message)
    return { network: res.networkName, networkPassphrase: res.networkPassphrase }
  }

  onChange(callback: (event: IOnChangeEvent) => void): void {
    cyphras.stellar.on('networkChange', ({ address, network, networkPassphrase }) => {
      callback({ address: address ?? '', network, networkPassphrase })
    })
  }

  async disconnect(): Promise<void> {
    await cyphras.stellar.disconnect()
  }
}
