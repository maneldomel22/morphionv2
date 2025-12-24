import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Plans() {
  const plans = [
    { name: 'Básico', price: 'R$ 29', credits: '500 créditos/mês' },
    { name: 'Pro', price: 'R$ 79', credits: '2.000 créditos/mês' },
    { name: 'Enterprise', price: 'R$ 199', credits: '10.000 créditos/mês' }
  ];

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Planos</h1>
      <p className="text-white/60 mb-8 text-lg">Escolha o plano ideal para suas necessidades</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} hover>
            <h3 className="text-xl font-bold mb-2 text-white">{plan.name}</h3>
            <p className="text-3xl font-bold text-white mb-1">{plan.price}</p>
            <p className="text-white/60 mb-6">{plan.credits}</p>
            <Button className="w-full">Selecionar</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
