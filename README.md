# [mute](http://encausse.net/s-a-r-a-h)

This plugin is an add-on for the framework [S.A.R.A.H.](http://encausse.net/s-a-r-a-h), an Home Automation project built 
on top of:
* C# (Kinect) client for Voice, Gesture, Face, QRCode recognition. 
* NodeJS (ExpressJS) server for Internet of Things communication


## License
```
 This program is free software. It comes without any warranty, to
 the extent permitted by applicable law. You can redistribute it
 and/or modify it under the terms of the Do What The Fuck You Want
 To Public License, Version 2, as published by S.A.R.A.H. See
 http://www.wtfpl.net/ for more details.
```

## Description

Sarah s'il te plait !
- Enchainez les règles sans devoir dire "Sarah".
- Auto mute après un timeout prédéfini.
- Niveau de confidence auto-incrémentable.
- Peut couper le son des périphériques que vous souhaitez pendant un dialogue.
- Peut réajuster automatiquement le niveau de micro.</li>
- Gère les règles standards, les lazy et le askme..


## Démarrage rapide

Téléchargez le plug-in et suivez la documentation  
   
   
## Versions
Version 1.3 - 01/10/2015
- Ajout d'un trigger "lazyStop" pour le plugin freebox

Version 1.2 - 26/09/2015
- Ajout du réajustement automatique du niveau du micro (2 propriétés: set_micro et level_micro).
- Utile si une application positionne automatiquement le niveau du micro et crée des problèmes de compréhension.

Version 1.1 - 30/07/2015
- Ajout d'une règle 'stop le mode silence' pour arrêter la remise automatique du mode silence (Pour le plugin 'scenariz')
- Meilleur contrôle des plugins et règles à ignorer.
- Règles dans le lazyMute.xml déplacées dans le mute.xml pour diminuer les faux.

Version 1.0 - 10/06/2015
- Version Released