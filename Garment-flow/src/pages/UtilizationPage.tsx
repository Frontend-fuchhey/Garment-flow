import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useERPStore } from "@/stores/erpStore";
import { UtilizationResult } from "@/types/erp";
import { Calculator, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function UtilizationPage() {
  const { materials } = useERPStore();
  const [materialName, setMaterialName] = useState("");
  const [unitType, setUnitType] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [productCount, setProductCount] = useState("");
  const [consumptionPerUnit, setConsumptionPerUnit] = useState("");
  const [result, setResult] = useState<UtilizationResult | null>(null);

  const calculateUtilization = () => {
    const count = parseFloat(productCount) || 0;
    const consumption = parseFloat(consumptionPerUnit) || 0;
    const stock = parseFloat(currentStock) || 0;
    const required = count * consumption;
    const sufficient = stock >= required;
    const deficit = sufficient ? 0 : required - stock;

    setResult({
      materialName: materialName || "Material",
      requiredQuantity: required,
      currentStock: stock,
      unitType: (unitType || "unit") as any,
      sufficient,
      deficit,
    });
  };

  const stockPercentage = result
    ? Math.min(100, (result.currentStock / result.requiredQuantity) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Item Utilization Calculator"
        description="Calculate raw material requirements for production runs"
        icon={Calculator}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Calculate Requirements</CardTitle>
            <CardDescription>
              Select material and enter production details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="materialName">Material Name</Label>
              <Input
                id="materialName"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="e.g., Cotton Fabric"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unitType">Unit Type</Label>
                <Input
                  id="unitType"
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  placeholder="e.g., Meter, KG"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currentStock">Current Stock</Label>
                <Input
                  id="currentStock"
                  type="number"
                  step="0.01"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  placeholder="e.g., 150"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="productCount">Finished Product Count</Label>
              <Input
                id="productCount"
                type="number"
                value={productCount}
                onChange={(e) => setProductCount(e.target.value)}
                placeholder="e.g., 100"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="consumption">
                Material per Product ({unitType || "unit"})
              </Label>
              <Input
                id="consumption"
                type="number"
                step="0.01"
                value={consumptionPerUnit}
                onChange={(e) => setConsumptionPerUnit(e.target.value)}
                placeholder="e.g., 1.5"
              />
              <p className="text-xs text-muted-foreground">
                How much material is needed to produce one finished product
              </p>
            </div>

            <Button
              onClick={calculateUtilization}
              disabled={!materialName || !productCount || !consumptionPerUnit || !currentStock}
              className="w-full"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Requirements
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className={cn(
          result && (result.sufficient ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5")
        )}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result ? (
                result.sufficient ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                )
              ) : null}
              Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6">
                <div className="text-center p-4 rounded-lg bg-card border">
                  <p className="text-sm text-muted-foreground mb-1">Material Required</p>
                  <p className="text-3xl font-bold font-mono">
                    {result.requiredQuantity.toFixed(2)} {result.unitType}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    for {productCount} products
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Stock</span>
                    <span className="font-mono">
                      {result.currentStock.toFixed(2)} {result.unitType}
                    </span>
                  </div>
                  <Progress 
                    value={stockPercentage} 
                    className={cn(
                      "h-3",
                      result.sufficient ? "[&>div]:bg-success" : "[&>div]:bg-destructive"
                    )}
                  />
                  <div className="flex justify-between text-sm">
                    <span>Coverage</span>
                    <span className="font-mono font-semibold">
                      {stockPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {result.sufficient ? (
                  <Card className="bg-success/10 border-success/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-success" />
                        <div>
                          <p className="font-semibold text-success">Stock Sufficient</p>
                          <p className="text-sm text-muted-foreground">
                            Remaining after production:{" "}
                            <span className="font-mono">
                              {(result.currentStock - result.requiredQuantity).toFixed(2)} {result.unitType}
                            </span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-destructive/10 border-destructive/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                        <div>
                          <p className="font-semibold text-destructive">Stock Insufficient</p>
                          <p className="text-sm text-muted-foreground">
                            Deficit:{" "}
                            <span className="font-mono font-semibold">
                              {result.deficit.toFixed(2)} {result.unitType}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Consider purchasing more {result.materialName}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Enter production details to calculate requirements</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
