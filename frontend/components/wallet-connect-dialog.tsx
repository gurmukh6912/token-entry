import { useState } from 'react'
import { useConnect } from 'wagmi'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface WalletConnectDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function WalletConnectDialog({ isOpen, onClose, onSuccess }: WalletConnectDialogProps) {
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect()
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null)

  const handleConnect = async (connector: any) => {
    setSelectedConnector(connector.id)
    try {
      await connect({ connector })
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Connect your wallet to purchase tickets
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {connectors.map((connector) => (
            <Button
              key={connector.id}
              onClick={() => handleConnect(connector)}
              disabled={!connector.ready || isLoading}
              variant={selectedConnector === connector.id ? "default" : "outline"}
              className="w-full justify-start gap-4"
            >
              {connector.name}
              {isLoading && pendingConnector?.id === connector.id && " (connecting)"}
            </Button>
          ))}
          {error && (
            <p className="text-sm text-red-500">
              {error.message}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 