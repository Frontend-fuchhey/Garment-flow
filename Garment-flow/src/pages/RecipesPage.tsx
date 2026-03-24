import { useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useERPStore } from "@/stores/erpStore";
import { RecipeIngredient, Recipe, RecipeUnit } from "@/types/erp";
import { BookOpen, Plus, Trash2, Calculator, CheckCircle, AlertTriangle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/DataTable";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ActionAuthModal } from "@/components/shared/ActionAuthModal";

export default function RecipesPage() {
  const { materials, recipes, addRecipe, updateRecipe, deleteRecipe } = useERPStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [productName, setProductName] = useState("");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [productionQty, setProductionQty] = useState("");
  const [calcResult, setCalcResult] = useState<{
    recipe: Recipe; qty: number;
    requirements: { materialName: string; needed: number; unitType: string; inStock: number; sufficient: boolean; deficit: number; }[];
  } | null>(null);

  // Auth modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireAuth = useCallback((action: () => void) => {
    setPendingAction(() => action);
    setIsAuthOpen(true);
  }, []);

  const openDialog = (recipe?: Recipe) => {
    if (recipe) { setEditingRecipe(recipe); setProductName(recipe.productName); setIngredients([...recipe.ingredients]); }
    else { setEditingRecipe(null); setProductName(""); setIngredients([]); }
    setIsDialogOpen(true);
  };

  const addIngredientRow = () => {
    setIngredients([
      ...ingredients,
      { materialId: "", materialName: "", quantityPerUnit: 0, unitType: "pcs" as RecipeUnit },
    ]);
  };

  const updateIngredientName = (index: number, name: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], materialName: name };
    setIngredients(updated);
  };

  const updateIngredient = (index: number, materialId: string) => {
    const mat = materials.find((m) => m.id === materialId);
    if (!mat) return;
    const updated = [...ingredients];
    updated[index] = {
      ...updated[index],
      materialId: mat.id,
      materialName: mat.name,
      unitType: mat.unitType,
    };
    setIngredients(updated);
  };

  const updateIngredientQty = (index: number, qty: number) => { const updated = [...ingredients]; updated[index] = { ...updated[index], quantityPerUnit: qty }; setIngredients(updated); };
  const updateIngredientUnit = (index: number, unit: RecipeUnit) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], unitType: unit };
    setIngredients(updated);
  };
  const removeIngredient = (index: number) => { setIngredients(ingredients.filter((_, i) => i !== index)); };

  const handleSaveRecipe = () => {
    if (!productName.trim() || ingredients.length === 0) { toast({ title: "Missing data", description: "Enter a product name and at least one ingredient.", variant: "destructive" }); return; }
    const validIngredients = ingredients.filter((i) => i.materialName.trim() && i.quantityPerUnit > 0);
    if (validIngredients.length === 0) { toast({ title: "Invalid ingredients", description: "Each ingredient needs a name and quantity > 0.", variant: "destructive" }); return; }
    if (editingRecipe) { updateRecipe(editingRecipe.id, { productName, ingredients: validIngredients }); toast({ title: "Recipe updated successfully" }); }
    else { addRecipe({ productName, ingredients: validIngredients }); toast({ title: "Recipe saved successfully" }); }
    setIsDialogOpen(false);
  };

  const handleDeleteRecipe = (id: string) => { deleteRecipe(id); toast({ title: "Recipe deleted", variant: "destructive" }); };

  const calculate = () => {
    const recipe = recipes.find((r) => r.id === selectedRecipeId);
    if (!recipe) return;
    const qty = parseFloat(productionQty) || 0;
    if (qty <= 0) return;
    const requirements = recipe.ingredients.map((ing) => {
      const mat = materials.find((m) => m.id === ing.materialId);
      const needed = ing.quantityPerUnit * qty;
      const inStock = mat?.quantity ?? 0;
      return { materialName: ing.materialName, needed, unitType: ing.unitType, inStock, sufficient: inStock >= needed, deficit: Math.max(0, needed - inStock) };
    });
    setCalcResult({ recipe, qty, requirements });
  };

  const allSufficient = calcResult?.requirements.every((r) => r.sufficient);

  const columns: Column<Recipe>[] = [
    { key: "productName", header: "Product", className: "font-medium" },
    {
      key: "ingredients",
      header: "Materials",
      render: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.ingredients
            .map((i) => {
              const name = i.materialName || "";
              const qty = i.quantityPerUnit ?? 0;
              const unit = i.unitType || "";
              if (!name) return "";
              if (!qty) return name;
              return `${qty} ${unit} - ${name}`;
            })
            .filter(Boolean)
            .join(", ")}
        </span>
      ),
    },
    {
      key: "ingredientCount",
      header: "# Ingredients",
      className: "font-mono",
      render: (r) => r.ingredients.length,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              requireAuth(() => openDialog(r));
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              requireAuth(() => handleDeleteRecipe(r.id));
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Production Recipes" description="Define bill of materials and calculate production requirements" icon={BookOpen}
        action={<Button onClick={() => openDialog()}><Plus className="w-4 h-4 mr-2" />New Recipe</Button>}
      />

      <Tabs defaultValue="recipes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recipes"><BookOpen className="w-4 h-4 mr-2" />Recipe Builder</TabsTrigger>
          <TabsTrigger value="calculator"><Calculator className="w-4 h-4 mr-2" />Production Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="space-y-4">
          <DataTable data={recipes} columns={columns} emptyMessage="No recipes yet. Create your first recipe to link products with raw materials." />
        </TabsContent>

        <TabsContent value="calculator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Calculate Requirements</CardTitle><CardDescription>Select a recipe and enter production quantity</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2"><Label>Product Recipe</Label>
                  <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                    <SelectTrigger><SelectValue placeholder="Select a recipe" /></SelectTrigger>
                    <SelectContent>{recipes.map((r) => <SelectItem key={r.id} value={r.id}>{r.productName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Production Quantity (units)</Label><Input type="number" value={productionQty} onChange={(e) => setProductionQty(e.target.value)} placeholder="e.g., 50" /></div>
                <Button className="w-full" disabled={!selectedRecipeId || !productionQty} onClick={calculate} skipShiftLock><Calculator className="w-4 h-4 mr-2" />Calculate</Button>
              </CardContent>
            </Card>

            <Card className={cn(calcResult && (allSufficient ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"))}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {calcResult ? (allSufficient ? <CheckCircle className="w-5 h-5 text-success" /> : <AlertTriangle className="w-5 h-5 text-destructive" />) : null}
                  Material Requirements
                </CardTitle>
                {calcResult && <CardDescription>For {calcResult.qty} units of {calcResult.recipe.productName}</CardDescription>}
              </CardHeader>
              <CardContent>
                {calcResult ? (
                  <div className="space-y-3">
                    {calcResult.requirements.map((req, i) => (
                      <div key={i} className={cn("flex items-center justify-between p-3 rounded-lg border", req.sufficient ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20")}>
                        <div><p className="font-medium text-sm">{req.materialName}</p><p className="text-xs text-muted-foreground">In stock: {req.inStock.toFixed(2)} {req.unitType}</p></div>
                        <div className="text-right"><p className="font-mono font-semibold text-sm">{req.needed.toFixed(2)} {req.unitType}</p>{!req.sufficient && <p className="text-xs font-mono text-destructive">Deficit: {req.deficit.toFixed(2)}</p>}</div>
                      </div>
                    ))}
                    <div className={cn("mt-4 p-3 rounded-lg flex items-center gap-3", allSufficient ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30")}>
                      {allSufficient ? (<><CheckCircle className="w-6 h-6 text-success" /><p className="text-sm font-semibold text-success">All materials sufficient for this production run</p></>) : (<><AlertTriangle className="w-6 h-6 text-destructive" /><p className="text-sm font-semibold text-destructive">Insufficient stock — purchase more materials</p></>)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground"><Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Select a recipe and quantity to calculate</p></div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingRecipe ? "Edit Recipe" : "New Recipe"}</DialogTitle><DialogDescription>Link a product to its raw material requirements.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2"><Label>Product Name</Label><Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g., Cotton T-Shirt" /></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label>Ingredients / Raw Materials</Label><Button type="button" variant="outline" size="sm" onClick={addIngredientRow}><Plus className="w-4 h-4 mr-1" />Add Material</Button></div>
              {ingredients.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No materials added yet. Click "Add Material" to start.</p>}
              {ingredients.map((ing, index) => (
                <div
                  key={index}
                  className="flex items-end gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1 grid gap-2">
                    <div className="grid gap-1">
                      <Label className="text-xs">Ingredient Name</Label>
                      <Input
                        value={ing.materialName}
                        onChange={(e) => updateIngredientName(index, e.target.value)}
                        placeholder="e.g., Custom Fabric A"
                      />
                    </div>
                    {materials.length > 0 && (
                      <div className="grid gap-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Link to stock material (optional)
                        </Label>
                        <Select
                          value={ing.materialId || ""}
                          onValueChange={(val) => updateIngredient(index, val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose from stock (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name} ({m.unitType})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="w-24 grid gap-1">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ing.quantityPerUnit || ""}
                      onChange={(e) =>
                        updateIngredientQty(
                          index,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="w-28 grid gap-1">
                    <Label className="text-xs">Unit</Label>
                    <Select
                      value={ing.unitType || ("pcs" as RecipeUnit)}
                      onValueChange={(val) =>
                        updateIngredientUnit(index, val as RecipeUnit)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">pcs</SelectItem>
                        <SelectItem value="Meter">meter</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                        <SelectItem value="KG">kg</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => removeIngredient(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveRecipe}>{editingRecipe ? "Update" : "Save"} Recipe</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionAuthModal open={isAuthOpen} onOpenChange={setIsAuthOpen} onSuccess={() => { pendingAction?.(); setPendingAction(null); }} />
    </div>
  );
}
