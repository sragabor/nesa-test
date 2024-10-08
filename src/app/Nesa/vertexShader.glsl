

vBallIndex = ballIndex;


zPosition = ballCenters.z;





float ballT = clamp((ballIndex - ballScroll) * 0.3, 0.0, 1.0);

vBallT.x = pow(clamp(((ballIndex + 12.0) - ballScroll) * 0.3, 0.0, 1.0), 2.0);
vBallT.y = pow(clamp(((ballIndex + 24.0) - ballScroll) * 0.3, 0.0, 1.0), 2.0);



  
vec3 direction = mix(vec3(0.0, 0.0, 0.0), vec3(0.0, 3.5, 0.0),pow( ballT, 2.0));
float waveStrength = 1.0 - clamp(abs(ballSections - visibleLayer) / 0.5, 0.0, 1.0);
transformed += WAVES;
transformed += direction;


vBallCenters = ballCenters + direction;

vec3 diff = (modelMatrix * vec4(vBallCenters, 1.0)).xyz - (selection);
float dst = length(diff);


dst = pow(1.0 - clamp(min(dst, touchRadius) / touchRadius, 0.0, 1.0), 2.0);
transformed += normalize(diff) * dst * touchEffect;

vBallCenters.x = clamp(pow(1.0 - ballT, 2.0) * 5.0 - 0.4, 0.0, 1.0);

vBallCenters.y = waveStrength;




