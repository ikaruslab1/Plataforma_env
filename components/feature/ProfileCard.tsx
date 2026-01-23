"use client"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Dialog } from "@/components/ui/Dialog"
import { Printer, ArrowLeft, Copy, Check } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export function ProfileCard({ 
    shortId, 
    displayName, 
    grado, 
    qrData,
    isNewUser = false,
    participacion
}: { 
    shortId: string, 
    displayName: string, 
    grado: string, 
    qrData: string,
    isNewUser?: boolean,
    participacion: string
}) {
  const [showWelcome, setShowWelcome] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isNewUser) {
        setShowWelcome(true)
    }
  }, [isNewUser])

  const handlePrint = () => {
    window.print()
  }

  const handleCopy = async () => {
    try {
        const url = `${window.location.origin}/?id=${shortId}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (err) {
        console.error("Error al copiar", err);
    }
  }

  const closeWelcome = () => {
      setShowWelcome(false)
      // Cleanup URL params without reloading
      router.replace(`/profile/${shortId}`, { scroll: false })
  }

  return (
    <div className="max-w-md mx-auto w-full animate-in fade-in zoom-in-95 duration-700">
        <div className="mb-6 flex items-center justify-between no-print">
            <Link href="/" passHref>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Volver
                </Button>
            </Link>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Enlace Copiado" : "Copiar Enlace"}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                    <Printer className="h-4 w-4" /> Imprimir
                </Button>
            </div>
        </div>

        <Card className="overflow-hidden border-2 shadow-2xl print:shadow-none print:border-2 print:border-black">
            <div className="bg-primary text-primary-foreground p-8 text-center print:bg-black print:text-white">
                 <p className="text-xs font-medium opacity-70 uppercase tracking-[0.2em] mb-2">ID de Acceso</p>
                 <h1 className="text-4xl font-bold tracking-wider font-mono select-all">{shortId}</h1>
            </div>
            
            <CardContent className="p-8 text-center space-y-8">
                <div className="space-y-3">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em]"><span className="font-bold">Ciencia con perspectiva:</span> <br />
Mujeres y Niñas en la Ciencia</p>
                    <h2 className="text-3xl font-bold text-foreground leading-tight">{displayName}</h2>
                    <div className="inline-block bg-secondary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-secondary-foreground border border-border/50">
                        {participacion}
                    </div>
                </div>

                <div className="flex justify-center p-4 bg-white rounded-xl border border-dashed border-gray-300 w-fit mx-auto shadow-sm">
                    <QRCodeSVG 
                        value={qrData} 
                        size={160}
                        level="Q"
                        marginSize={0}
                    />
                </div>
                
                <div className="pt-6 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase">
                        <span className="font-bold">Facultad de Estudios Superiores Acatlán
</span> <br />
Unidad de Investigación Multidisciplinaria Aplicada
                    </p>
                </div>
            </CardContent>
        </Card>

        {/* Welcome Dialog for New Users */}
        <Dialog isOpen={showWelcome} onClose={closeWelcome} title="¡Registro Exitoso!">
            <div className="space-y-4 text-center">
                <p className="text-muted-foreground">Tu perfil está listo.</p>
                
                <div className="bg-blue-100 p-4 rounded-lg border border-blue-500">
                    <p className="font-semibold text-xl mb-1 text-black">⚠️ IMPORTANTE</p>
                    <p className="text-xs text-black">Guarda tu ID para iniciar sesión en el futuro. Es tu única llave de acceso.</p>
                </div>

                <div className="bg-secondary p-4 rounded-lg border border-border my-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Tu ID de Acceso</p>
                    <p className="text-3xl font-bold tracking-wider text-primary mt-2 font-mono">{shortId}</p>
                </div>

                <div className="flex flex-col gap-2">
                    <Button onClick={handleCopy} variant="outline" className="w-full gap-2">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Enlace Copiado" : "Copiar Enlace"}
                    </Button>
                    <Button onClick={handlePrint} variant="outline" className="w-full gap-2">
                        <Printer className="h-4 w-4" /> Imprimir Credencial
                    </Button>
                    <Button className="w-full mt-2" onClick={closeWelcome}>
                        Entendido, continuar
                    </Button>
                </div>
            </div>
        </Dialog>
        
        <style jsx global>{`
            @media print {
                .no-print { display: none !important; }
                body { background: white; }
                main { padding: 0; align-items: flex-start; }
            }
        `}</style>
    </div>
  )
}
