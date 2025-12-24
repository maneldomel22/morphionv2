import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

// ETAPA 1 - Modo padrão
const MODES = [
  { id: 'safe', label: 'SAFE', description: 'Conteúdo apropriado para todas as audiências' },
  { id: 'hot', label: 'HOT', description: 'Conteúdo adulto explícito' }
];

// ETAPA 2 - Aparência Facial
const ETHNICITIES = [
  'Caucasiana', 'Africana', 'Asiática', 'Latina',
  'Oriente Médio', 'Mista', 'Outra'
];

const SKIN_TONES = [
  'Muito Clara', 'Clara', 'Média',
  'Morena', 'Escura', 'Muito Escura'
];

const EYE_COLORS = [
  'Azuis', 'Verdes', 'Castanhos', 'Mel',
  'Cinzas', 'Âmbar', 'Pretos'
];

const EYE_SHAPES = [
  'Amendoados', 'Redondos', 'Caídos',
  'Puxados', 'Profundos'
];

const FACE_SHAPES = [
  'Oval', 'Redondo', 'Quadrado',
  'Coração', 'Triangular', 'Longo'
];

const NOSES = [
  'Fino', 'Médio', 'Largo',
  'Arrebitado', 'Aquilino', 'Reto'
];

const LIPS = [
  'Finos', 'Médios', 'Carnudos', 'Muito Carnudos'
];

const BASE_EXPRESSIONS = [
  'Neutra', 'Confiante', 'Sorriso Leve',
  'Séria', 'Misteriosa'
];

// ETAPA 3 - Cabelo
const HAIR_COLORS = [
  'Loiro', 'Castanho Claro', 'Castanho', 'Castanho Escuro',
  'Preto', 'Ruivo', 'Acobreado', 'Grisalho', 'Platinado'
];

const HAIR_STYLES = [
  'Solto', 'Preso', 'Semi-preso', 'Trançado',
  'Coque', 'Rabo de Cavalo', 'Franja', 'Undercut'
];

const HAIR_LENGTHS = [
  'Muito Curto', 'Curto', 'Médio', 'Longo', 'Muito Longo'
];

const HAIR_TEXTURES = [
  'Liso', 'Levemente Ondulado', 'Ondulado',
  'Cacheado', 'Muito Cacheado', 'Crespo'
];

// ETAPA 4 - Corpo
const BODY_TYPES = [
  'Magro', 'Atlético', 'Médio',
  'Curvilíneo', 'Plus Size', 'Musculoso'
];

const HEIGHTS = [
  'Baixa (150-160cm)', 'Média (160-170cm)',
  'Alta (170-180cm)', 'Muito Alta (180cm+)'
];

const PROPORTIONS = [
  'Equilibradas', 'Pernas Longas',
  'Tronco Longo', 'Ampulheta'
];

const SHOULDERS = ['Estreitos', 'Médios', 'Largos'];
const WAISTS = ['Fina', 'Média', 'Larga'];
const HIPS = ['Estreitos', 'Médios', 'Largos', 'Muito Largos'];
const LEGS = ['Finas', 'Médias', 'Torneadas', 'Musculosas'];
const POSTURES = ['Ereta', 'Relaxada', 'Levemente Inclinada', 'Confiante'];

// ETAPA 5 - Marcas Corporais
const TATTOO_SIZES = ['Pequena', 'Média', 'Grande'];
const SCAR_VISIBILITIES = ['Discreta', 'Visível'];

export default function CreateInfluencerQuiz({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Etapa 1
    name: '',
    username: '',
    age: '',
    style: '',
    mode: 'safe',

    // Etapa 2 - Face
    ethnicity: '',
    skin_tone: '',
    skin_tone_detail: '',
    eye_color: '',
    eye_shape: '',
    face_shape: '',
    nose: '',
    lips: '',
    base_expression: '',

    // Etapa 3 - Hair
    hair_color: '',
    hair_style: '',
    hair_length: '',
    hair_texture: '',

    // Etapa 4 - Body
    body_type: '',
    height: '',
    proportions: '',
    shoulders: '',
    waist: '',
    hips: '',
    legs: '',
    posture: '',

    // Etapa 5 - Body Marks
    has_marks: false,
    has_tattoos: false,
    has_moles: false,
    has_scars: false,
    tattoos: [],
    moles: [],
    scars: []
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const addTattoo = () => {
    setFormData(prev => ({
      ...prev,
      tattoos: [...prev.tattoos, { location: '', size: 'Média', style: '' }]
    }));
  };

  const removeTattoo = (index) => {
    setFormData(prev => ({
      ...prev,
      tattoos: prev.tattoos.filter((_, i) => i !== index)
    }));
  };

  const updateTattoo = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      tattoos: prev.tattoos.map((tattoo, i) =>
        i === index ? { ...tattoo, [field]: value } : tattoo
      )
    }));
  };

  const addMole = () => {
    setFormData(prev => ({
      ...prev,
      moles: [...prev.moles, { location: '' }]
    }));
  };

  const removeMole = (index) => {
    setFormData(prev => ({
      ...prev,
      moles: prev.moles.filter((_, i) => i !== index)
    }));
  };

  const updateMole = (index, value) => {
    setFormData(prev => ({
      ...prev,
      moles: prev.moles.map((mole, i) =>
        i === index ? { location: value } : mole
      )
    }));
  };

  const addScar = () => {
    setFormData(prev => ({
      ...prev,
      scars: [...prev.scars, { location: '', visibility: 'Visível' }]
    }));
  };

  const removeScar = (index) => {
    setFormData(prev => ({
      ...prev,
      scars: prev.scars.filter((_, i) => i !== index)
    }));
  };

  const updateScar = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      scars: prev.scars.map((scar, i) =>
        i === index ? { ...scar, [field]: value } : scar
      )
    }));
  };

  const canProceedStep1 = formData.name && formData.username && formData.age && formData.style;
  const canProceedStep2 = formData.ethnicity && formData.skin_tone && formData.eye_color &&
    formData.eye_shape && formData.face_shape && formData.nose && formData.lips && formData.base_expression;
  const canProceedStep3 = formData.hair_color && formData.hair_style && formData.hair_length && formData.hair_texture;
  const canProceedStep4 = formData.body_type && formData.height && formData.proportions &&
    formData.shoulders && formData.waist && formData.hips && formData.legs && formData.posture;
  const canProceedStep5 = !formData.has_marks ||
    ((!formData.has_tattoos || formData.tattoos.every(t => t.location && t.style)) &&
     (!formData.has_moles || formData.moles.every(m => m.location)) &&
     (!formData.has_scars || formData.scars.every(s => s.location)));

  const canProceed = () => {
    if (step === 1) return canProceedStep1;
    if (step === 2) return canProceedStep2;
    if (step === 3) return canProceedStep3;
    if (step === 4) return canProceedStep4;
    if (step === 5) return canProceedStep5;
    return false;
  };

  const renderSelectGrid = (options, field, columns = 2) => (
    <div className={`grid grid-cols-${columns} gap-3`}>
      {options.map(option => (
        <button
          key={option}
          onClick={() => handleInputChange(field, option)}
          className={`p-3 rounded-lg border-2 transition-all text-left ${
            formData[field] === option
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <span className="font-medium text-gray-900 dark:text-white text-sm">
            {option}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(num => (
            <div
              key={num}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                num === step
                  ? 'bg-blue-500 text-white'
                  : num < step
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}
            >
              {num}
            </div>
          ))}
        </div>
        <span className="text-sm text-gray-500">Etapa {step} de 5</span>
      </div>

      {/* ETAPA 1 - INFORMAÇÕES BÁSICAS */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Informações Básicas
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Influencer
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Sarah Johnson"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Ex: @sarahjohnson"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Idade
            </label>
            <input
              type="text"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              placeholder="Ex: 25"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estilo Geral
            </label>
            <textarea
              value={formData.style}
              onChange={(e) => handleInputChange('style', e.target.value)}
              placeholder="Ex: Fitness casual, lifestyle urbano, estética minimalista"
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modo Padrão
            </label>
            <div className="grid grid-cols-2 gap-3">
              {MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => handleInputChange('mode', mode.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.mode === mode.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white">{mode.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{mode.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 2 - APARÊNCIA FACIAL */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Aparência Facial
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Etnia
            </label>
            {renderSelectGrid(ETHNICITIES, 'ethnicity', 2)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cor da Pele
            </label>
            {renderSelectGrid(SKIN_TONES, 'skin_tone', 3)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nuance da Pele (opcional)
            </label>
            <input
              type="text"
              value={formData.skin_tone_detail}
              onChange={(e) => handleInputChange('skin_tone_detail', e.target.value)}
              placeholder="Ex: Tom de oliva, tons rosados, tons dourados"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cor dos Olhos
            </label>
            {renderSelectGrid(EYE_COLORS, 'eye_color', 2)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formato dos Olhos
            </label>
            {renderSelectGrid(EYE_SHAPES, 'eye_shape', 2)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formato do Rosto
            </label>
            {renderSelectGrid(FACE_SHAPES, 'face_shape', 3)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nariz
            </label>
            {renderSelectGrid(NOSES, 'nose', 3)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lábios
            </label>
            {renderSelectGrid(LIPS, 'lips', 2)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expressão Base
            </label>
            {renderSelectGrid(BASE_EXPRESSIONS, 'base_expression', 2)}
          </div>
        </div>
      )}

      {/* ETAPA 3 - CABELO */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cabelo
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cor do Cabelo
            </label>
            {renderSelectGrid(HAIR_COLORS, 'hair_color', 3)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estilo do Cabelo
            </label>
            {renderSelectGrid(HAIR_STYLES, 'hair_style', 2)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comprimento
            </label>
            {renderSelectGrid(HAIR_LENGTHS, 'hair_length', 2)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Textura
            </label>
            {renderSelectGrid(HAIR_TEXTURES, 'hair_texture', 3)}
          </div>
        </div>
      )}

      {/* ETAPA 4 - CORPO */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Corpo
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo Físico
            </label>
            {renderSelectGrid(BODY_TYPES, 'body_type', 3)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Altura Aproximada
            </label>
            {renderSelectGrid(HEIGHTS, 'height', 2)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Proporções Corporais
            </label>
            {renderSelectGrid(PROPORTIONS, 'proportions', 2)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ombros
            </label>
            {renderSelectGrid(SHOULDERS, 'shoulders', 3)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cintura
            </label>
            {renderSelectGrid(WAISTS, 'waist', 3)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quadris
            </label>
            {renderSelectGrid(HIPS, 'hips', 2)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pernas
            </label>
            {renderSelectGrid(LEGS, 'legs', 2)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Postura
            </label>
            {renderSelectGrid(POSTURES, 'posture', 2)}
          </div>
        </div>
      )}

      {/* ETAPA 5 - MARCAS CORPORAIS */}
      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Marcas Corporais
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Esse influencer possui alguma marca corporal?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleInputChange('has_marks', true)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.has_marks
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="font-medium text-gray-900 dark:text-white">Sim</span>
              </button>
              <button
                onClick={() => handleInputChange('has_marks', false)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  !formData.has_marks
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="font-medium text-gray-900 dark:text-white">Não</span>
              </button>
            </div>
          </div>

          {formData.has_marks && (
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={formData.has_tattoos}
                    onChange={(e) => handleInputChange('has_tattoos', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tatuagens
                  </span>
                </label>

                {formData.has_tattoos && (
                  <div className="space-y-3 ml-6">
                    {formData.tattoos.map((tattoo, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tatuagem {index + 1}
                          </span>
                          <button
                            onClick={() => removeTattoo(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Localização (ex: braço direito)"
                          value={tattoo.location}
                          onChange={(e) => updateTattoo(index, 'location', e.target.value)}
                          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                        />
                        <select
                          value={tattoo.size}
                          onChange={(e) => updateTattoo(index, 'size', e.target.value)}
                          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                        >
                          {TATTOO_SIZES.map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Estilo (ex: tribal, realista, minimalista)"
                          value={tattoo.style}
                          onChange={(e) => updateTattoo(index, 'style', e.target.value)}
                          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                        />
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addTattoo}
                      className="w-full"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Tatuagem
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={formData.has_moles}
                    onChange={(e) => handleInputChange('has_moles', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pintas
                  </span>
                </label>

                {formData.has_moles && (
                  <div className="space-y-3 ml-6">
                    {formData.moles.map((mole, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Pinta {index + 1}
                          </span>
                          <button
                            onClick={() => removeMole(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Localização (ex: rosto, colo, braço)"
                          value={mole.location}
                          onChange={(e) => updateMole(index, e.target.value)}
                          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                        />
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addMole}
                      className="w-full"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Pinta
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={formData.has_scars}
                    onChange={(e) => handleInputChange('has_scars', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cicatrizes
                  </span>
                </label>

                {formData.has_scars && (
                  <div className="space-y-3 ml-6">
                    {formData.scars.map((scar, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Cicatriz {index + 1}
                          </span>
                          <button
                            onClick={() => removeScar(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Localização (ex: sobrancelha, joelho)"
                          value={scar.location}
                          onChange={(e) => updateScar(index, 'location', e.target.value)}
                          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                        />
                        <select
                          value={scar.visibility}
                          onChange={(e) => updateScar(index, 'visibility', e.target.value)}
                          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                        >
                          {SCAR_VISIBILITIES.map(vis => (
                            <option key={vis} value={vis}>{vis}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addScar}
                      className="w-full"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Cicatriz
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={step === 1 ? onCancel : handleBack}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {step === 1 ? 'Cancelar' : 'Voltar'}
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="flex-1"
        >
          {step === 5 ? 'Finalizar' : 'Próximo'}
          {step < 5 && <ChevronRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
