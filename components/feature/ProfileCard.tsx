"use client"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"

export function ProfileCard({ 
    shortId, 
    displayName, 
    grado, 
    qrData 
}: { 
    shortId: string, 
    displayName: string, 
    grado: string, 
    qrData: string 
}) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-md mx-auto w-full animate-in fade-in zoom-in-95 duration-700">
        <div className="mb-6 flex items-center justify-between no-print">
            <Link href="/" passHref>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Volver
                </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" /> Imprimir
            </Button>
        </div>

        <Card className="overflow-hidden border-2 shadow-2xl print:shadow-none print:border-2 print:border-black">
            <div className="bg-primary text-primary-foreground p-8 text-center print:bg-black print:text-white">
                 <p className="text-xs font-medium opacity-70 uppercase tracking-[0.2em] mb-2">ID Académico</p>
                 <h1 className="text-4xl font-bold tracking-wider font-mono">{shortId}</h1>
            </div>
            
            <CardContent className="p-8 text-center space-y-8">
                <div className="space-y-3">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em]">Titular Certificado</p>
                    <h2 className="text-3xl font-bold text-foreground leading-tight">{displayName}</h2>
                    <div className="inline-block bg-secondary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-secondary-foreground border border-border/50">
                        {grado}
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
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                         Academic Profiles System
                    </p>
                </div>
            </CardContent>
        </Card>
        
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
