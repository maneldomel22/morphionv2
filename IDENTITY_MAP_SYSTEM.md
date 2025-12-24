# Identity Map System - Character Reference Grid

## Overview

The Identity Map System generates a comprehensive 9-panel grid image for each influencer, serving as a complete physical identity reference for all future content generation.

## What Changed

### Database
- **New Column**: `identity_map_image_url` added to `influencers` table
- Stores the URL of the 9-panel identity grid
- Nullable for backwards compatibility
- Existing `image_url` remains for profile display

### Prompt Architecture

**Previous**: Single full-body portrait
**New**: 9-panel grid with multiple views and body part close-ups

#### Grid Layout Structure

The generated image is a single composite containing 9 panels:

1. **Panel 1**: Full body – front view
2. **Panel 2**: Full body – back view
3. **Panel 3**: Face close-up – neutral expression
4. **Panel 4**: Upper torso close-up (chest & abdomen)
5. **Panel 5**: Left arm close-up
6. **Panel 6**: Right arm close-up
7. **Panel 7**: Legs close-up (thighs & calves)
8. **Panel 8**: Back close-up (upper and lower back)
9. **Panel 9**: Detail panel highlighting permanent body marks

### Prompt Template

The new prompt uses ALL quiz data collected from the user:

#### Variables Injected
- **Basic Info**: Age
- **Face**: Ethnicity, skin tone, skin tone detail, eye color, eye shape, face shape, nose, lips, expression
- **Hair**: Color, style, length, texture
- **Body**: Type, height, proportions, shoulders, waist, hips, legs, posture
- **Body Marks**: Tattoos (location, size, style), moles (locations), scars (location, visibility)

#### Prompt Style
- **Clinical/Documentary**: Not artistic or fashion-oriented
- **Neutral Background**: Light gray studio
- **Even Lighting**: No dramatic shadows or effects
- **Identity Consistency**: Same person across all 9 panels
- **Technical Quality**: 4K resolution, ultra-realistic

### File Changes

#### `/src/services/influencerIdentityBuilder.js`
- `buildInitialInfluencerPrompt()` completely rewritten
- Now generates 9-panel grid prompt
- Uses template literals to inject all quiz variables
- Handles body marks formatting (tattoos, moles, scars)

#### `/src/components/influencer/CreateInfluencerModal.jsx`
- Changed aspect ratio from `1:1` to `16:9` (better for grid layout)
- Now saves to both `image_url` and `identity_map_image_url`
- Updated loading message to "Gerando imagem de perfil..."

#### `/supabase/migrations/[timestamp]_add_identity_map_to_influencers.sql`
- Adds `identity_map_image_url` column
- Uses conditional migration to avoid conflicts

## User Flow

1. User completes 5-step quiz collecting detailed physical attributes
2. System creates influencer record in database
3. Identity map prompt is built using all quiz answers
4. Nano Banana Pro generates 9-panel grid image
5. Image saved as both `image_url` and `identity_map_image_url`
6. Grid serves as permanent reference for future posts

## Compatibility

- **Backwards Compatible**: Existing influencers without identity maps continue to work
- **No Breaking Changes**: Quiz flow unchanged, only final prompt modified
- **Dual Storage**: Both profile photo and identity map URLs stored

## Usage in Future Content

When generating influencer posts (images or videos):
- System can reference `identity_map_image_url` for comprehensive body/face details
- All 9 views provide better consistency than single photo
- Body marks, proportions, and features locked across all content

## Technical Notes

### Aspect Ratio Choice
- **16:9** chosen to accommodate 3x3 grid layout
- Wider format prevents panel cramping
- Maintains high resolution across all 9 sections

### Engine Compatibility
- Works with Nano Banana Pro (safe content)
- Compatible with Seedream for hot mode
- Grid format supported by both engines

### Quality Settings
- Resolution: 4K
- Format: PNG
- No compression to preserve identity details

## Example Prompt Structure

```
Create a high-resolution CHARACTER IDENTITY MAP image.

GRID LAYOUT: 9 panels showing the SAME woman
[Panel descriptions]

SUBJECT DESCRIPTION (LOCKED):
Gender: Female
Age: 28
Ethnicity: Latina
Skin tone: Morena (warm golden undertones)
[All quiz variables injected here]

PERMANENT BODY MARKS:
Tattoos: Medium floral tattoo on right shoulder, Small minimalist tattoo on left wrist
Moles: Moles on: face, neck, left arm
Scars: No scars

CRITICAL: Every panel shows the exact same woman with identical features.
```

## Migration Path

**New Influencers**: Automatically get identity map
**Existing Influencers**: Continue using `image_url`, can optionally regenerate with new system

## Benefits

1. **Consistency**: Multiple views ensure AI maintains same identity
2. **Completeness**: Body marks and proportions documented
3. **Reference Quality**: Clinical documentation vs artistic photo
4. **Flexibility**: Can reference specific body parts for different poses
5. **Permanence**: Comprehensive archive of physical identity
